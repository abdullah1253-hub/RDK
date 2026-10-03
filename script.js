// --- CONFIGURATION ---
const DELIVERY_FEE = 2.00;
const MINIMUM_ORDER = 10.00;
const WHATSAPP_NUMBER = "34613802925";
let cart = [];

// --- NAVIGATION LOGIC ---
function showPage(page) {
    const homeView = document.getElementById('home-view');
    const menuView = document.getElementById('menu-view');
    
    // Desktop Nav Elements
    const navDeskHome = document.getElementById('nav-desktop-home');
    const navDeskMenu = document.getElementById('nav-desktop-menu');
    
    // Mobile Nav Elements
    const navMobHome = document.getElementById('nav-mobile-home');
    const navMobMenu = document.getElementById('nav-mobile-menu');

    if(page === 'home') {
        homeView.classList.remove('hidden');
        menuView.classList.add('hidden');
        
        // Update Desktop active state
        if(navDeskHome) {
            navDeskHome.classList.replace('text-white', 'text-theme-red');
            navDeskHome.classList.replace('border-transparent', 'border-theme-red');
            navDeskMenu.classList.replace('text-theme-red', 'text-white');
            navDeskMenu.classList.replace('border-theme-red', 'border-transparent');
        }
        
        // Update Mobile active state
        if(navMobHome) {
            navMobHome.classList.replace('text-gray-400', 'text-theme-red');
            navMobMenu.classList.replace('text-theme-red', 'text-gray-400');
        }
    } else {
        homeView.classList.add('hidden');
        menuView.classList.remove('hidden');
        
        // Update Desktop active state
        if(navDeskMenu) {
            navDeskMenu.classList.replace('text-white', 'text-theme-red');
            navDeskMenu.classList.replace('border-transparent', 'border-theme-red');
            navDeskHome.classList.replace('text-theme-red', 'text-white');
            navDeskHome.classList.replace('border-theme-red', 'border-transparent');
        }

        // Update Mobile active state
        if(navMobMenu) {
            navMobMenu.classList.replace('text-gray-400', 'text-theme-red');
            navMobHome.classList.replace('text-theme-red', 'text-gray-400');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// --- CART LOGIC ---
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (sidebar.classList.contains('cart-closed')) {
        sidebar.classList.remove('cart-closed');
        sidebar.classList.add('cart-open');
        overlay.classList.remove('hidden');
        // Prevent background scrolling on mobile
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.add('cart-closed');
        sidebar.classList.remove('cart-open');
        overlay.classList.add('hidden');
        // Restore background scrolling
        document.body.style.overflow = '';
    }
}

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: Date.now(), name: name, price: price, quantity: 1, note: "" });
    }
    renderCart();
    
    // Provide tactile/visual feedback for mobile
    if (navigator.vibrate) navigator.vibrate(50); // Small vibration on Android
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        renderCart();
    }
}

function updateNote(id, note) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.note = note;
    }
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const badgeDesktop = document.getElementById('cart-badge-desktop');
    const badgeMobile = document.getElementById('cart-badge-mobile');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    // Update Badges
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        if(badgeDesktop) { badgeDesktop.textContent = totalItems; badgeDesktop.classList.remove('hidden'); }
        if(badgeMobile) { badgeMobile.textContent = totalItems; badgeMobile.classList.remove('hidden'); }
    } else {
        if(badgeDesktop) badgeDesktop.classList.add('hidden');
        if(badgeMobile) badgeMobile.classList.add('hidden');
    }

    // Render Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="text-center text-gray-500 mt-10">Tu carrito está vacío</div>';
        subtotalEl.textContent = '0.00€';
        totalEl.textContent = '0.00€';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const itemHTML = `
            <div class="bg-[#111] p-3 rounded-xl border border-gray-800">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-sm flex-1 pr-2 leading-tight">${item.name}</h4>
                    <span class="text-theme-yellow font-bold">${(item.price * item.quantity).toFixed(2)}€</span>
                </div>
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3 bg-black rounded-lg p-1 border border-gray-800">
                        <button onclick="updateQuantity(${item.id}, -1)" class="w-8 h-8 bg-gray-800 rounded-md text-white flex items-center justify-center active:bg-theme-red"><i class="fas fa-minus text-xs"></i></button>
                        <span class="w-4 text-center font-bold">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="w-8 h-8 bg-gray-800 rounded-md text-white flex items-center justify-center active:bg-theme-red"><i class="fas fa-plus text-xs"></i></button>
                    </div>
                </div>
                <input type="text" placeholder="Añadir nota (ej. Sin cebolla)" 
                       value="${item.note}"
                       onchange="updateNote(${item.id}, this.value)"
                       class="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-theme-red">
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    // Update Totals
    subtotalEl.textContent = `${subtotal.toFixed(2)}€`;
    totalEl.textContent = `${(subtotal + DELIVERY_FEE).toFixed(2)}€`;
}

// --- FORM LOGIC ---
function handlePaymentChange() {
    const paymentSelect = document.getElementById('c-payment').value;
    const cashOptions = document.getElementById('cash-options');
    if (paymentSelect === 'efectivo') {
        cashOptions.classList.remove('hidden');
    } else {
        cashOptions.classList.add('hidden');
    }
}

function handleCashChange() {
    const exactSelect = document.getElementById('c-exact').value;
    const changeInputDiv = document.getElementById('change-input-div');
    if (exactSelect === 'no') {
        changeInputDiv.classList.remove('hidden');
    } else {
        changeInputDiv.classList.add('hidden');
    }
}

// --- CHECKOUT TO WHATSAPP ---
function sendOrderViaWhatsApp() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío. Añade algunos productos primero.");
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (subtotal < MINIMUM_ORDER) {
        alert(`El pedido mínimo es de ${MINIMUM_ORDER.toFixed(2)}€. Te faltan ${(MINIMUM_ORDER - subtotal).toFixed(2)}€.`);
        return;
    }

    const name = document.getElementById('c-name').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const payment = document.getElementById('c-payment').value;

    if (!name || !address || !phone) {
        alert("Por favor, rellena todos los datos de envío (Nombre, Dirección y Teléfono).");
        return;
    }

    let paymentText = "";
    if (payment === 'tarjeta') {
        paymentText = "💳 Tarjeta (El repartidor debe llevar datáfono)";
    } else {
        const exact = document.getElementById('c-exact').value;
        if (exact === 'si') {
            paymentText = "💵 Efectivo (Tengo el importe exacto)";
        } else {
            const changeAmount = document.getElementById('c-change').value.trim();
            if (!changeAmount) {
                alert("Por favor, indica para cuánto necesitas cambio en efectivo.");
                return;
            }
            paymentText = `💵 Efectivo (Necesito cambio de ${changeAmount}€)`;
        }
    }

    let msg = `*¡Hola! Quiero hacer un pedido a domicilio:*\n\n`;
    msg += `*🛒 MI PEDIDO:*\n`;
    cart.forEach(item => {
        msg += `▪ ${item.quantity}x ${item.name} - ${(item.price * item.quantity).toFixed(2)}€\n`;
        if (item.note) {
            msg += `   ↳ _Nota: ${item.note}_\n`;
        }
    });

    msg += `\n*🧾 RESUMEN:*\n`;
    msg += `Subtotal: ${subtotal.toFixed(2)}€\n`;
    msg += `Envío: ${DELIVERY_FEE.toFixed(2)}€\n`;
    msg += `*TOTAL A PAGAR: ${(subtotal + DELIVERY_FEE).toFixed(2)}€*\n\n`;

    msg += `*📍 MIS DATOS:*\n`;
    msg += `Nombre: ${name}\n`;
    msg += `Dirección: ${address}\n`;
    msg += `Teléfono: ${phone}\n\n`;
    msg += `*💰 MÉTODO DE PAGO:*\n${paymentText}`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
}