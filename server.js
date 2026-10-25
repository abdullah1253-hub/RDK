require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const WA_NUMBER = '34613802925';
const FEE = 2.00;
const MIN_ORDER = 10.00;
const EXTRA = { queso: 0.50, carne: 1.00, solo: 1.00, salsa: 0.50 };
const ALLOW_CLOSED = process.env.ALLOW_CLOSED === 'true'; // solo para pruebas

/* ---------- Carta: se lee de tu menu.js (precios fiables, del servidor) ---------- */
const menuSrc = fs.readFileSync(path.join(__dirname, 'menu.js'), 'utf8');
const MENU = vm.runInNewContext(
  menuSrc + '\n;({ ITEMS: typeof ITEMS !== "undefined" ? ITEMS : [], HOURS: typeof HOURS !== "undefined" ? HOURS : [] })'
);
const ITEMS = MENU.ITEMS;
const HOURS = MENU.HOURS;

// Bebidas rápidas del carrito (mismos nombres que addQuickDrink en script.js)
const QUICK = {};
['Coca Cola', 'Coca Cola Cero', 'Coca Cola Cero Cero', 'Sprite', 'Fanta Naranja', 'Fanta Limón',
 'Aquarius Limón', 'Aquarius Naranja', 'Aquarius Melocotón', 'Fuze Tea Limón', 'Fuze Tea Maracuyá']
  .forEach(n => QUICK[n + ' (Lata)'] = 2.00);
QUICK['Agua 0.5L'] = 1.00;
QUICK['Coca-Cola 2L'] = 3.00;

/* ---------- Utilidades ---------- */
const r2 = n => Math.round(n * 100) / 100;
const eur = n => n.toFixed(2).replace('.', ',') + '€';
const clean = (s, max = 200) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function madridNow() {
  const parts = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Madrid' }).formatToParts(new Date());
  return (+parts.find(p => p.type === 'hour').value % 24) + (+parts.find(p => p.type === 'minute').value) / 60;
}
const isOpen = () => { const n = madridNow(); return HOURS.some(([a, b]) => n >= a && n < b); };

/* Recalcula cada línea con precios del servidor */
function priceLine(l) {
  const qty = parseInt(l.qty, 10);
  if (!qty || qty < 1 || qty > 20) return null;
  const item = ITEMS.find(i => i.id === l.itemId);
  const units = Array.isArray(l.units) ? l.units.slice(0, 10) : [];
  let unit, name;
  if (item) {
    name = item.name;
    unit = item.price;
    units.forEach(u => (Array.isArray(u.parts) ? u.parts : []).forEach(p => {
      if (p === '+ Extra queso') unit += EXTRA.queso;
      if (p === '+ Extra carne') unit += EXTRA.carne;
      if (p === 'Solo carne') unit += EXTRA.solo;
    }));
  } else if (QUICK[l.name] !== undefined) {
    name = l.name;
    unit = QUICK[l.name];
  } else return null;
  return {
    name, qty, unit,
    units: units.map(u => ({ label: clean(u.label, 40), parts: (Array.isArray(u.parts) ? u.parts : []).map(p => clean(p, 60)).slice(0, 8) })),
    multi: units.length > 1,
    drink: clean(l.drink, 60),
    note: clean(l.note, 140)
  };
}

function buildTicket(o) {
  const W = 52;
  const LINE = '─'.repeat(W);
  const L = [];
  const total = r2(o.sub + FEE);

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' });

  L.push(LINE);
  L.push('          REHMAN DÖNER KEBAB          ');
  L.push('  Ronda de Outeiro, 224 - A Coruña    ');
  L.push('    Tel: 881 512 777 / 613 802 925    ');
  L.push(LINE);
  L.push('        *** NUEVO PEDIDO  ***         ');
  L.push('   *** PAGADO ONLINE (STRIPE) ***     ');
  L.push('Pedido #' + o.id + ' | ' + dateStr + ' ' + timeStr);
  L.push(LINE);
  L.push('CLIENTE:');
  L.push(o.customer.name);
  L.push(o.customer.address);
  L.push(o.customer.phone);
  L.push(LINE);
  L.push('PRODUCTOS:');
  
  o.lines.forEach((l, i) => {
    if (i > 0) L.push('');
    L.push(l.qty + 'x ' + l.name + ' - ' + eur(l.unit * l.qty));
    l.units.forEach(u => {
      const t = Array.isArray(u.parts) ? u.parts.join(' | ') : '';
      if (t) L.push('   * ' + (l.multi ? u.label + ': ' : '') + t);
    });
    if (l.drink) L.push('   * Bebida: ' + l.drink);
    if (l.note)  L.push('   * Nota: ' + l.note);
  });

  const sc = o.sauces || {};
  const sauceTotal = (sc.blanca || 0) + (sc.roja || 0) + (sc.picante || 0);
  if (sauceTotal > 0) {
    L.push(LINE);
    if (sc.blanca) L.push('   * ' + sc.blanca + 'x Salsa blanca');
    if (sc.roja) L.push('   * ' + sc.roja + 'x Salsa roja');
    if (sc.picante) L.push('   * ' + sc.picante + 'x Salsa picante');
  }

  L.push(LINE);
  L.push('Subtotal:      ' + eur(o.sub));
  L.push('Gastos Envío:  ' + eur(FEE));
  L.push('TOTAL A PAGAR: ' + eur(total));
  L.push(LINE);
  L.push('MÉTODO DE PAGO:');
  L.push('Tarjeta Online (Pagado)');
  
  if (o.note) {
    L.push(LINE);
    L.push('NOTA: ' + o.note);
  }
  
  L.push(LINE);
  L.push('');
  L.push('');
  L.push('');

  return L.join('\n');
}

const ticketToMeta = t => {
  const meta = {};
  (t.match(/[\s\S]{1,450}/g) || []).forEach((c, i) => meta['t' + i] = c);
  return meta;
};
const ticketFromMeta = m => {
  let out = '';
  for (let i = 0; m['t' + i] !== undefined; i++) out += m['t' + i];
  return out;
};

async function notify(text) {
  const { TELEGRAM_BOT_TOKEN: tk, TELEGRAM_CHAT_ID: chat } = process.env;
  console.log('\n=== NUEVO PEDIDO PAGADO ===\n' + text + '\n===========================\n');
  if (!tk || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${tk}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: text.replace(/\*/g, '') })    });
  } catch (e) { console.error('Telegram error:', e.message); }
}

/* ---------- WEBHOOK (debe ir ANTES de express.json) ---------- */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Webhook inválido:', e.message);
    return res.status(400).send('Webhook Error');
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status === 'paid') await notify(ticketFromMeta(s.metadata || {}));
  }
  res.json({ received: true });
});

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json({ limit: '100kb' }));

/* ---------- Archivos públicos (solo los de la web, NUNCA .env ni server.js) ---------- */
['index.html', 'success.html', 'styles.css', 'menu.js', 'script.js'].forEach(f =>
  app.get('/' + (f === 'index.html' ? '' : f), (req, res) => res.sendFile(path.join(__dirname, f))));
app.use('/fotos-menu', express.static(path.join(__dirname, 'fotos-menu')));

/* ---------- Crear sesión de pago ---------- */
app.post('/create-checkout-session', async (req, res) => {
  try {
    if (!ALLOW_CLOSED && !isOpen()) return res.status(400).json({ error: 'Cerrado ahora mismo' });

    const { cart, sauces, customer, note } = req.body || {};
    if (!Array.isArray(cart) || !cart.length || cart.length > 40) return res.status(400).json({ error: 'Carrito inválido' });

    const lines = cart.map(priceLine);
    if (lines.some(l => !l)) return res.status(400).json({ error: 'Producto inválido' });

    const sc = {};
    ['blanca', 'roja', 'picante'].forEach(k => sc[k] = Math.max(0, Math.min(20, parseInt((sauces || {})[k], 10) || 0)));
    const sauceCount = sc.blanca + sc.roja + sc.picante;

    const sub = lines.reduce((s, l) => s + l.unit * l.qty, 0) + sauceCount * EXTRA.salsa;
    if (sub < MIN_ORDER) return res.status(400).json({ error: `Pedido mínimo ${eur(MIN_ORDER)}` });

    const cust = {
      name: clean(customer && customer.name, 80),
      address: clean(customer && customer.address, 200),
      phone: clean(customer && customer.phone, 30)
    };
    if (!cust.name || !cust.address || cust.phone.replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'Datos de entrega inválidos' });

    const order = {
      id: Math.random().toString(36).slice(2, 7).toUpperCase(),
      customer: cust, lines, sauces: sc, sub, note: clean(note, 250)
    };

    const line_items = lines.map(l => ({
      quantity: l.qty,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(l.unit * 100),
        product_data: {
          name: l.name,
          ...(l.units.flatMap(u => u.parts).concat(l.drink ? ['Bebida: ' + l.drink] : []).join(', ')
            ? { description: l.units.flatMap(u => u.parts).concat(l.drink ? ['Bebida: ' + l.drink] : []).join(', ').slice(0, 300) }
            : {})
        }
      }
    }));
    if (sauceCount) line_items.push({
      quantity: sauceCount,
      price_data: { currency: 'eur', unit_amount: Math.round(EXTRA.salsa * 100), product_data: { name: 'Salsa extra' } }
    });
    line_items.push({
      quantity: 1,
      price_data: { currency: 'eur', unit_amount: Math.round(FEE * 100), product_data: { name: 'Gastos de envío' } }
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      metadata: ticketToMeta(buildTicket(order)),
      success_url: `${FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/`
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('Stripe Error:', e.message);
    res.status(500).json({ error: 'Error al crear el pago' });
  }
});

/* ---------- Verificar pago (lo usa success.html) ---------- */
app.get('/order-status', async (req, res) => {
  try {
    const id = String(req.query.session_id || '');
    if (!id.startsWith('cs_')) return res.status(400).json({ paid: false });
    const s = await stripe.checkout.sessions.retrieve(id);
    if (s.payment_status !== 'paid') return res.json({ paid: false });
    const ticket = ticketFromMeta(s.metadata || {});
    res.json({ paid: true, waUrl: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ticket)}` });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ paid: false });
  }
});

app.listen(PORT, () => console.log(`Stripe backend running on port ${PORT}`));