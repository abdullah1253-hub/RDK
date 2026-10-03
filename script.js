/* =========================================================
   REHMAN DÖNER KEBAB — lógica de la web
   ========================================================= */
const FEE = 2.00;
const MIN_ORDER = 10.00;
const WA_NUMBER = '34613802925';
const P = { queso: 0.50, carne: 1.00, solo: 1.00, salsa: 0.50 };
const STORE = 'rehman-kebab-v3';

const $ = (s, r = document) => r.querySelector(s); const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = n => n.toFixed(2).replace('.', ',') + '€';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => ITEMS.find(i => i.id === id);
const catName = id => (CATS.find(c => c.id === id) || {}).name || '';

let cart = [];
let sauces = { blanca: 0, roja: 0, picante: 0 };
let pay = { type: 'efectivo', exact: 'si' };
let st = null;

// Efecto visual de salpicadura de salsa al pulsar botones
document.addEventListener('click', e => {
  const btn = e.target.closest('button, .card, .feature, .pill, .chip, .extra');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const drop = document.createElement('span');
  drop.className = 'sauce-splash';
  const size = Math.max(rect.width, rect.height) * 1.2;
  drop.style.width = drop.style.height = `${size}px`;
  drop.style.left = `${e.clientX - rect.left - size/2}px`;
  drop.style.top = `${e.clientY - rect.top - size/2}px`;
  btn.appendChild(drop);
  setTimeout(() => drop.remove(), 450);
});

/* ---------- Guardado local ---------- */
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      cart, sauces, pay,
      name: $('#cName').value, address: $('#cAddress').value, phone: $('#cPhone').value
    }));
  } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (!d) return;
    cart = (d.cart || []).filter(l => l && byId(l.itemId));
    sauces = Object.assign(sauces, d.sauces || {});
    pay = Object.assign(pay, d.pay || {});
    $('#cName').value = d.name || '';
    $('#cAddress').value = d.address || '';
    $('#cPhone').value = d.phone || '';
  } catch (e) {}
}

/* ---------- Utilidades ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2300);
}
const buzz = () => { if (navigator.vibrate) navigator.vibrate(30); };

/* ---------- Horario (hora de Madrid) ---------- */
function madridNow() {
  try {
    const parts = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Madrid' }).formatToParts(new Date());
    const h = +parts.find(p => p.type === 'hour').value % 24;
    const m = +parts.find(p => p.type === 'minute').value;
    return h + m / 60;
  } catch (e) { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
}
const fmtH = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
function openState() {
  const now = madridNow();
  const cur = HOURS.find(([a, b]) => now >= a && now < b);
  if (cur) return { open: true, text: `Abierto ahora · cierra a las ${fmtH(cur[1])}` };
  const next = HOURS.find(([a]) => now < a) || HOURS[0];
  return { open: false, text: `Cerrado ahora · abrimos a las ${fmtH(next[0])}` };
}
const isOpen = () => openState().open;
function updateStatus() {
  const s = $('#status'), o = openState();
  s.classList.toggle('closed', !o.open);
  $('span', s).textContent = o.text;
}

function thumb(it) {
  const img = it.img ? `<img src="${it.img}" alt="${esc(it.name)}" loading="lazy" onerror="this.remove()">` : '';
  return `<div class="thumb"><span>${esc(catName(it.cat))}</span>${img}</div>`;
}

function cardHTML(it, n) {
  return `<article class="card" data-id="${it.id}" style="animation-delay:${n * 40}ms">
    <div class="info-col">
      ${it.badge ? `<span class="badge">${esc(it.badge)}</span>` : ''}
      <h4>${esc(it.name)}</h4><p>${esc(it.desc || '')}</p><div class="price">${eur(it.price)}</div>
    </div>
    ${thumb(it)}
    <span class="plus" aria-hidden="true">+</span>
  </article>`;
}
function featureHTML(it, n) {
  const img = it.img ? `<img src="${it.img}" alt="${esc(it.name)}" loading="lazy" onerror="this.remove()">` : '';
  return `<article class="feature card-hit" data-id="${it.id}" style="animation-delay:${n * 90}ms">
    <div class="f-img"><span>${esc(it.name)}</span>${img}<div class="f-badge">${esc(it.badge || 'Novedad')}</div></div>
    <div class="f-body">
      <h3>${esc(it.name)}</h3>
      <p>${esc(it.desc || '')}</p>
      <div class="f-foot"><span class="f-price">${eur(it.price)}</span><span class="f-btn">Añadir</span></div>
    </div>
  </article>`;
}

function renderMenu() {
  $('#menu').innerHTML = CATS.map(c => {
    const items = ITEMS.filter(i => i.cat === c.id);
    const body = c.id === 'novedades'
      ? `<div class="feature-grid">${items.map(featureHTML).join('')}</div>`
      : `<div class="grid">${items.map(cardHTML).join('')}</div>`;
    return `<section class="section" id="${c.id}">
      <div class="section-head"><span>${c.id === 'novedades' ? 'Lo último de la casa' : 'Rehman Döner Kebab'}</span><h2>${c.name}</h2></div>
      ${body}</section>`;
  }).join('');

  $('#pills').innerHTML = CATS.map((c, i) =>
    `<button class="pill${i === 0 ? ' on' : ''}" data-go="${c.id}">${c.name}</button>`).join('');
}

function setupScrollSpy() {
  const pills = $$('.pill');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        pills.forEach(p => p.classList.toggle('on', p.dataset.go === e.target.id));
        const on = $('.pill.on');         if (on) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });       }     });   }, { rootMargin: '-120px 0px -65\% 0px' });   $$('.section').forEach(s => obs.observe(s));
}

function setupSearch() {
  $('#search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let any = false;
    $$('.section').forEach(sec => {       let vis = 0;       $$
('[data-id]', sec).forEach(card => {
        const it = byId(card.dataset.id);
        const hit = !q || (it.name + ' ' + (it.desc || '')).toLowerCase().includes(q);
        card.style.display = hit ? '' : 'none';
        if (hit) vis++;
      });
      sec.style.display = vis ? '' : 'none';
      if (vis) any = true;
    });
    $('#empty').hidden = any;
  });
}

function openOverlay(id) {
  const o = $('#' + id);
  o.hidden = false;
  document.body.classList.add('lock');
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('show')));
}
function closeOverlay(id) {
  const o = $('#' + id);   o.classList.remove('show');   setTimeout(() => {     o.hidden = true;     if ($$('.overlay').every(x => x.hidden)) document.body.classList.remove('lock');
    refreshBar();
  }, 280);
}

function onItem(id) {
  const it = byId(id);
  buzz();
  
  // Mostrar foto grande en el popup
  const imgWrap = $('#sheetImgWrap');
  const imgEl = $('#sheetImg');
  if (it.img) {
    imgEl.src = it.img;
    imgWrap.hidden = false;
  } else {
    imgWrap.hidden = true;
    imgEl.src = '';
  }

  st = {
    item: it, qty: 1, drink: null,
    units: (it.units || []).map(u => ({
      kind: u.kind, label: u.label, meats: u.meats || MEATS,
      meat: (u.meats || MEATS)[0], side: SIDES[0], queso: false, carne: false, solo: false
    }))
  };
  $('#sheetTitle').textContent = it.name;
  $('#sheetDesc').textContent = it.desc || '';
  $('#sheetNote').hidden = !it.note;
  $('#noteInput').value = '';
  $('#sheetDrink').hidden = !it.drink;
  renderUnits();
  renderDrinks();
  updateSheetPrice();
  $('.sheet-body',$('#sheet')).scrollTop = 0;
  openOverlay('sheet');
}

function unitExtra(u) {
  const falafel = u.meat === 'Falafel';
  return (u.queso ? P.queso : 0) + (u.carne && !falafel ? P.carne : 0) + (u.solo && !falafel ? P.solo : 0);
}
function unitPrice() { return st.item.price + st.units.reduce((s, u) => s + unitExtra(u), 0); }

function renderUnits() {
  const multi = st.units.length > 1;
  $('#sheetUnits').innerHTML = st.units.map((u, i) => {
    const k = KINDS[u.kind];
    if (!k) return '';
    const falafel = u.meat === 'Falafel';
    let h = `<div class="unit">`;
    if (multi) h += `<h5>${esc(u.label)} ${i + 1}</h5>`;
    if (k.meat) {
      h += `<div><div class="group-label">Tipo de carne</div><div class="chips">` +
        u.meats.map(m => `<button class="chip${u.meat === m ? ' on' : ''}" data-act="meat" data-u="${i}" data-v="${m}">${m}</button>`).join('') + `</div></div>`;
    }
    if (k.side) {
      h += `<div><div class="group-label">Guarnición</div><div class="chips">` +
        SIDES.map(s => `<button class="chip${u.side === s ? ' on' : ''}" data-act="side" data-u="${i}" data-v="${s}">${s}</button>`).join('') + `</div></div>`;
    }
    const ex = [];
    if (k.queso) ex.push(['queso', 'Extra queso', P.queso]);
    if (k.carne && !falafel) ex.push(['carne', 'Extra carne', P.carne]);
    if (k.solo && !falafel) ex.push(['solo', 'Solo carne (sin ensalada)', P.solo]);
    if (ex.length) {
      h += `<div><div class="group-label">Extras</div><div style="display:grid;gap:8px">` +
        ex.map(([key, name, pr]) => `<button class="extra${u[key] ? ' on' : ''}" data-act="tog" data-u="${i}" data-k="${key}"><span><i class="box"></i>${name}</span><em>+${eur(pr)}</em></button>`).join('') + `</div></div>`;
    }
    return h + `</div>`;
  }).join('');
}

function renderDrinks() {
  if (!st.item.drink) return;
  $('#drinkList').innerHTML = DRINKS.map(d =>
    `<button class="chip${st.drink === d ? ' on' : ''}" data-drink="${esc(d)}">${esc(d)}</button>`).join('');
}

function updateSheetPrice() {
  $('#qVal').textContent = st.qty;
  $('#addPrice').textContent = eur(unitPrice() * st.qty);
}

function describeUnit(u) {
  const k = KINDS[u.kind];
  if (!k) return [];
  const parts = [];
  if (k.meat) parts.push(u.meat);
  if (k.side) parts.push(u.side);
  if (u.queso) parts.push('+ Extra queso');
  if (u.carne && u.meat !== 'Falafel') parts.push('+ Extra carne');
  if (u.solo && u.meat !== 'Falafel') parts.push('Solo carne');
  return parts;
}

function confirmItem() {
  const it = st.item;
  if (it.drink && !st.drink) {
    toast('Elige tu bebida');
    $('#sheetDrink').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const units = st.units.map(u => ({ label: u.label, parts: describeUnit(u) }));
  const note = it.note ? $('#noteInput').value.trim() : '';
  const drink = it.drink ? st.drink : '';
  const line = { itemId: it.id, name: it.name, price: unitPrice(), qty: st.qty, units, multi: units.length > 1, drink, note };
  const key = JSON.stringify([line.itemId, line.price, units, drink, note]);
  const ex = cart.find(l => JSON.stringify([l.itemId, l.price, l.units, l.drink || '', l.note]) === key);
  if (ex) ex.qty += st.qty; else cart.push(line);
  closeOverlay('sheet');
  afterCartChange();
  toast('Añadido al pedido');
}

function addDirect(it) {
  const ex = cart.find(l => l.itemId === it.id && !l.units.length && !l.drink);
  if (ex) ex.qty++;
  else cart.push({ itemId: it.id, name: it.name, price: it.price, qty: 1, units: [], multi: false, drink: '', note: '' });
  afterCartChange();
  toast(it.name + ' añadido');
}

const sauceCount = () => sauces.blanca + sauces.roja + sauces.picante;
const subtotal = () => cart.reduce((s, l) => s + l.price * l.qty, 0) + sauceCount() * P.salsa;
const itemCount = () => cart.reduce((s, l) => s + l.qty, 0) + sauceCount();

function afterCartChange() {
  save();
  refreshBar();
  if (!$('#cart').hidden) renderCart();
}

function refreshBar() {
  const bar = $('#bar');   const anyOpen = $$('.overlay').some(o => !o.hidden);
  const n = itemCount();
  if (n > 0 && !anyOpen) {
    $('#barQty').textContent = n;
    $('#barPrice').textContent = eur(subtotal());
    bar.hidden = false;
    requestAnimationFrame(() => bar.classList.add('show'));
    const b = $('#barBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  } else {
    bar.classList.remove('show');
    setTimeout(() => { if (!bar.classList.contains('show')) bar.hidden = true; }, 350);
  }
}

function renderCart() {
  const box = $('#cartItems');
  if (!cart.length) {
    box.innerHTML = `<div class="empty-cart">Tu pedido está vacío.<br>Añade algo de la carta.</div>`;
  } else {
    box.innerHTML = cart.map((l, i) => {
      const li = [];
      l.units.forEach(u => {
        const txt = u.parts.join(' · ');
        if (!txt) return;
        li.push(`<li>${l.multi ? `<b>${esc(u.label)}:</b> ` : ''}${esc(txt)}</li>`);
      });
      if (l.drink) li.push(`<li><b>Bebida:</b> ${esc(l.drink)}</li>`);
      if (l.note) li.push(`<li class="note">Nota: ${esc(l.note)}</li>`);
      return `<div class="line">
        <div class="l-main"><div class="l-top"><h5>${esc(l.name)}</h5><span class="l-price">${eur(l.price * l.qty)}</span></div>
        ${li.length ? `<ul>${li.join('')}</ul>` : ''}</div>
        <div class="mini" data-line="${i}"><button data-d="-1">&minus;</button><b>${l.qty}</b><button data-d="1">+</button></div>
      </div>`;
    }).join('');
  }
  $('#clearBtn').hidden = !cart.length;
  Object.keys(sauces).forEach(k => $(`.mini[data-sauce="${k}"] b`).textContent = sauces[k]);

  const sub = subtotal();
  const total = sub + FEE;
  $('#tSub').textContent = eur(sub);
  $('#tFee').textContent = eur(FEE);
  $('#tTotal').textContent = eur(total);
  $('#sendPrice').textContent = eur(total);
  $('#minFill').style.width = Math.min(100, sub / MIN_ORDER * 100) + '%';
  $('#minBox').classList.toggle('ok', sub >= MIN_ORDER);
  $('#minText').textContent = sub >= MIN_ORDER
    ? 'Has alcanzado el pedido mínimo'
    : `Añade ${eur(MIN_ORDER - sub)} más para llegar al pedido mínimo de ${eur(MIN_ORDER)}`;

  $$('#payType button').forEach(b => b.classList.toggle('on', b.dataset.v === pay.type));   $$
('#exactType button').forEach(b => b.classList.toggle('on', b.dataset.v === pay.exact));
  
  const isCash = pay.type === 'efectivo';
  $('#cashBox').hidden = !isCash;
  $('#cardHint').hidden = isCash;
  $('#changeBox').hidden = !isCash || pay.exact !== 'no';
}

function sendOrder() {
  if (!cart.length) return toast('Tu pedido está vacío');
  const sub = subtotal();
  if (sub < MIN_ORDER) return toast(`Pedido mínimo ${eur(MIN_ORDER)} · faltan ${eur(MIN_ORDER - sub)}`);

  const name = $('#cName').value.trim();
  const address = $('#cAddress').value.trim();
  const phone = $('#cPhone').value.trim();
  if (!name) { $('#cName').focus(); return toast('Escribe tu nombre'); }
  if (!address) { $('#cAddress').focus(); return toast('Escribe tu dirección'); }
  if (phone.replace(/\D/g, '').length < 9) { $('#cPhone').focus(); return toast('Escribe un teléfono válido'); }

  const total = sub + FEE;
  let payText;
  if (pay.type === 'tarjeta') {
    payText = 'Tarjeta (el repartidor lleva datáfono)';
  } else if (pay.exact === 'si') {
    payText = 'Efectivo, importe exacto';
  } else {
    const c = parseFloat($('#cChange').value);
    if (!c || c < total) { $('#cChange').focus(); return toast(`Indica con cuánto pagas (mínimo ${eur(total)})`); }
    payText = `Efectivo, paga con ${eur(c)} (cambio: ${eur(c - total)})`;
  }
  if (!isOpen() && !confirm('Ahora mismo estamos cerrados. ¿Enviar el pedido igualmente?')) return;

  const id = Math.random().toString(36).slice(2, 7).toUpperCase();
  const BIG_LINE = '==============================';
  const L = [];

  L.push('*NUEVO PEDIDO · REHMAN DÖNER KEBAB*');
  L.push(`Pedido #${id}`);
  L.push(BIG_LINE);

  L.push('*DATOS DEL CLIENTE*');
  L.push(`Nombre: ${name}`);
  L.push(`Dirección: ${address}`);
  L.push(`Teléfono: ${phone}`);
  L.push(BIG_LINE);

  L.push('*PRODUCTOS*');
  cart.forEach((l, idx) => {
    if (idx > 0) {
      L.push(BIG_LINE);
    }
    L.push(`*${l.qty}x ${l.name}* — ${eur(l.price * l.qty)}`);
    l.units.forEach(u => {
      const txt = u.parts.join(' | ');
      if (txt) L.push(`    • ${l.multi ? u.label + ': ' : ''}${txt}`);
    });
    if (l.drink) L.push(`    • Bebida: ${l.drink}`);
    if (l.note) L.push(`    • Nota: ${l.note}`);
  });

  if (sauceCount()) {
    L.push(BIG_LINE);
    L.push('*SALSAS EXTRA*');
    if (sauces.blanca) L.push(`    • ${sauces.blanca}x Salsa blanca`);
    if (sauces.roja) L.push(`    • ${sauces.roja}x Salsa roja`);
    if (sauces.picante) L.push(`    • ${sauces.picante}x Salsa picante`);
  }

  L.push(BIG_LINE);

  L.push(`Subtotal: ${eur(sub)}`);
  L.push(`Envío: ${eur(FEE)}`);
  L.push(`*TOTAL A PAGAR: ${eur(total)}*`);
  L.push(BIG_LINE);
  L.push('*MÉTODO DE PAGO*');
  L.push(payText);

  const gen = $('#cNote').value.trim();
  if (gen) {
    L.push(BIG_LINE);
    L.push('*NOTA GENERAL*');
    L.push(gen);
  }

  save();
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(L.join('\n'))}`, '_blank');
}

function bind() {
  // Manejo de clics diferenciados en la carta
  $('#menu').addEventListener('click', e => {
    const card = e.target.closest('[data-id]');
    if (!card) return;
    const itemId = card.dataset.id;
    const it = byId(itemId);
    if (!it) return;

    // Comprobar si se hizo clic explícitamente en el botón de más (+) o botón de añadir
    const isPlusClick = e.target.closest('.plus, .f-btn');

    if (isPlusClick) {
      // Si el producto tiene opciones (carne, bebida, etc.), abrimos el popup obligatoriamente
      if (it.units || it.drink) {
        onItem(itemId);
      } else {
        // Si no tiene opciones (ej. raciones o bebidas simples), se añade directamente
        addDirect(it);
      }
    } else {
      // Si hacen clic en la foto, el nombre o la descripción, abren el popup para ver la foto grande y detalles
      onItem(itemId);
    }
  });

  $('#pills').addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (!b) return;
    const el = document.getElementById(b.dataset.go);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#heroBtn').addEventListener('click', () => $('#novedades').scrollIntoView({ behavior: 'smooth' }));

  $('#sheetUnits').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const u = st.units[+b.dataset.u];
    if (b.dataset.act === 'meat') {
      u.meat = b.dataset.v;
      if (u.meat === 'Falafel') { u.carne = false; u.solo = false; }
    }
    if (b.dataset.act === 'side') u.side = b.dataset.v;
    if (b.dataset.act === 'tog') u[b.dataset.k] = !u[b.dataset.k];
    buzz();
    renderUnits();
    updateSheetPrice();
  });
  $('#drinkList').addEventListener('click', e => {
    const b = e.target.closest('[data-drink]');
    if (!b) return;
    st.drink = b.dataset.drink;
    buzz();
    renderDrinks();
  });
  $('#qMinus').addEventListener('click', () => { if (st.qty > 1) { st.qty--; updateSheetPrice(); } });
  $('#qPlus').addEventListener('click', () => { if (st.qty < 20) { st.qty++; updateSheetPrice(); } });
  $('#addBtn').addEventListener('click', confirmItem);    $$('[data-close]').forEach(b => b.addEventListener('click', () => closeOverlay(b.dataset.close)));
  $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) closeOverlay(o.id); }));   document.addEventListener('keydown', e => {     if (e.key === 'Escape') $$
('.overlay').filter(o => !o.hidden).forEach(o => closeOverlay(o.id));
  });

  $('#barBtn').addEventListener('click', () => { renderCart(); openOverlay('cart'); $('#bar').classList.remove('show'); });
  $('#cartItems').addEventListener('click', e => {
    const b = e.target.closest('button[data-d]');
    if (!b) return;
    const i = +b.closest('.mini').dataset.line;
    cart[i].qty += +b.dataset.d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    buzz();
    afterCartChange();
  });
  $('#clearBtn').addEventListener('click', () => {     if (confirm('¿Vaciar todo el pedido?')) { cart = []; sauces = { blanca: 0, roja: 0, picante: 0 }; afterCartChange(); }   });   $$('.mini[data-sauce]').forEach(m => m.addEventListener('click', e => {
    const b = e.target.closest('button[data-d]');
    if (!b) return;
    const k = m.dataset.sauce;
    sauces[k] = Math.max(0, sauces[k] + +b.dataset.d);
    buzz();
    afterCartChange();
  }));
  $('#payType').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    pay.type = b.dataset.v; save(); renderCart();
  });
  $('#exactType').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    pay.exact = b.dataset.v; save(); renderCart();
  });
  ['#cName', '#cAddress', '#cPhone'].forEach(s => $(s).addEventListener('input', save));$('#sendBtn').addEventListener('click', sendOrder);
}

renderMenu();
load();
bind();
setupScrollSpy();
setupSearch();
updateStatus();
setInterval(updateStatus, 60000);
refreshBar();