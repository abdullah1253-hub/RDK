/* =========================================================
   REHMAN DÖNER KEBAB — CARTA Y AJUSTES
   Aquí se edita todo: precios, nombres, fotos, horario y bebidas.
   - img: ruta de la foto real (carpeta fotos-menu/). Si el archivo
     no existe, la web muestra una tarjeta elegante automáticamente.
   - units: opciones que se piden por cada producto.
   - note: true => permite nota (solo kebab, durum y lahmacun).
   - drink: true => el cliente elige bebida (solo menús).
   ========================================================= */

/* Horario (todos los días). Formato [abre, cierra] en horas decimales */
const HOURS = [[13, 16], [19, 23.5]];
const HOURS_TEXT = '13:00 a 16:00 · 19:00 a 23:30';

const CATS = [
  { id: 'novedades', name: 'Novedades' },
  { id: 'ofertas',   name: 'Ofertas' },
  { id: 'menus',     name: 'Menús' },
  { id: 'kebab',     name: 'Kebab' },
  { id: 'durum',     name: 'Durum' },
  { id: 'lahmacun',  name: 'Lahmacun' },
  { id: 'platos',    name: 'Platos' },
  { id: 'raciones',  name: 'Raciones' },
  { id: 'bebidas',   name: 'Bebidas' }
];

/* Bebidas que se pueden elegir dentro de los menús */
const DRINKS = [
  'Coca-Cola',
  'Coca-Cola Zero',
  'Coca-Cola Zero Zero',
  'Aquarius Limón',
  'Aquarius Naranja',
  'Fanta Naranja',
  'Fanta Limón',
  'Fuze Tea Limón',
  'Fuze Tea Maracuyá',
  'Sprite',
  'Botella de agua'
];

/* Tipos de producto (qué opciones aparecen):
   wrap      -> carne + extra queso + extra carne + solo carne
   wrapSolo  -> carne + extra queso + extra carne (ya es "solo carne")
   falafel   -> solo extra queso (no lleva carne)
   plato     -> carne + guarnición (patatas/arroz) + extras
   platoNS   -> carne + extras (guarnición fija)
   infantil  -> carne + guarnición
*/
const KINDS = {
  wrap:     { meat: true, queso: true, carne: true, solo: true },
  wrapSolo: { meat: true, queso: true, carne: true },
  falafel:  { queso: true },
  plato:    { meat: true, side: true, queso: true, carne: true },
  platoNS:  { meat: true, queso: true, carne: true },
  infantil: { meat: true, side: true }
};

const MEATS = ['Pollo', 'Ternera', 'Mixto'];
const SIDES = ['Patatas', 'Arroz'];

const U = (kind, label, n = 1, extra = {}) =>
  Array.from({ length: n }, () => ({ kind, label, ...extra }));

const ITEMS = [
  /* ---------- NOVEDADES ---------- */
  { id: 'tacos', cat: 'novedades', name: 'Tacos Francés', desc: 'Tacos de pollo casero con patatas y salsa integrada. Crujientes por fuera, cremosos por dentro.', price: 9.00, img: 'fotos-menu/tacos-frances.jpg', badge: 'Novedad' },
  { id: 'menu-tacos', cat: 'novedades', name: 'Menú Tacos Francés', desc: 'Nuestros tacos de pollo casero con patatas y salsa, acompañados de una bebida a tu elección.', price: 12.00, img: 'fotos-menu/menu-tacos.jpg', badge: 'Menú', drink: true },

  /* ---------- OFERTAS (incluyen botella fija, sin elegir bebida) ---------- */
  { id: 'o1', cat: 'ofertas', name: 'Oferta 1', desc: '3 Kebab, 1 patatas y 1 Coca-Cola 1,25L', price: 20.00, img: 'fotos-menu/oferta-1.jpg', units: U('wrap', 'Kebab', 3), note: true },
  { id: 'o2', cat: 'ofertas', name: 'Oferta 2', desc: '2 Platos y 1 Coca-Cola 1,25L', price: 14.00, img: 'fotos-menu/oferta-2.jpg', units: U('plato', 'Plato', 2) },
  { id: 'o3', cat: 'ofertas', name: 'Oferta 3', desc: '2 Durum, 1 patatas y 1 Coca-Cola 1,25L', price: 15.00, img: 'fotos-menu/oferta-3.jpg', units: U('wrap', 'Durum', 2), note: true },
  { id: 'o4', cat: 'ofertas', name: 'Oferta 4', desc: '4 Durum, 1 patatas y 1 Coca-Cola 1,25L', price: 24.00, img: 'fotos-menu/oferta-4.jpg', units: U('wrap', 'Durum', 4), note: true },
  { id: 'o5', cat: 'ofertas', name: 'Oferta 5', desc: '3 Durum, 1 patatas y 1 Coca-Cola 1,25L', price: 23.00, img: 'fotos-menu/oferta-5.jpg', units: U('wrap', 'Durum', 3), note: true },
  { id: 'o6', cat: 'ofertas', name: 'Oferta 6', desc: '3 Hamburguesas, 1 patatas y 1 Coca-Cola 1,25L', price: 14.00, img: 'fotos-menu/oferta-6.jpg' },
  { id: 'o7', cat: 'ofertas', name: 'Oferta 7', desc: '3 Kebab, alitas (6 uds), 1 patatas y 1 Coca-Cola', price: 24.00, img: 'fotos-menu/oferta-7.jpg', units: U('wrap', 'Kebab', 3), note: true },
  { id: 'o8', cat: 'ofertas', name: 'Oferta 8', desc: '4 Kebab, 1 patatas y 1 Coca-Cola 1,25L', price: 24.00, img: 'fotos-menu/oferta-8.jpg', units: U('wrap', 'Kebab', 4), note: true },

  /* ---------- MENÚS (con bebida a elegir) ---------- */
  { id: 'm9',  cat: 'menus', name: '9. Menú Kebab', desc: 'Kebab, patatas y bebida', price: 7.50, img: 'fotos-menu/menu-9.jpg', units: U('wrap', 'Kebab'), note: true, drink: true },
  { id: 'm10', cat: 'menus', name: '10. Menú Durum', desc: 'Durum, patatas y bebida', price: 8.00, img: 'fotos-menu/menu-10.jpg', units: U('wrap', 'Durum'), note: true, drink: true },
  { id: 'm11', cat: 'menus', name: '11. Menú Lahmacun', desc: 'Lahmacun, patatas y bebida', price: 8.50, img: 'fotos-menu/menu-11.jpg', units: U('wrap', 'Lahmacun'), note: true, drink: true },
  { id: 'm13', cat: 'menus', name: '13. Menú Infantil', desc: 'Carne con arroz o patatas y bebida', price: 6.50, img: 'fotos-menu/menu-13.jpg', units: U('infantil', 'Menú infantil'), drink: true },
  { id: 'm14', cat: 'menus', name: '14. Menú Plato', desc: 'Plato con ensalada y salsa, y bebida', price: 8.00, img: 'fotos-menu/menu-14.jpg', units: U('plato', 'Plato'), drink: true },
  { id: 'm15', cat: 'menus', name: '15. Menú Hamburguesa', desc: 'Hamburguesa de pollo y queso con ensalada y salsa, patatas y bebida', price: 6.50, img: 'fotos-menu/menu-15.jpg', drink: true },
  { id: 'm16', cat: 'menus', name: '16. Menú Plato Queso Gratinado', desc: 'Patatas con queso gratinado, carne, salsa y bebida', price: 8.00, img: 'fotos-menu/menu-16.jpg', units: U('platoNS', 'Plato'), drink: true },

  /* ---------- KEBAB ---------- */
  { id: 'k17', cat: 'kebab', name: '17. Kebab', desc: 'Pollo, ternera o mixto, con ensalada y salsa', price: 5.00, img: 'fotos-menu/kebab.jpg', units: U('wrap', 'Kebab'), note: true },
  { id: 'k18', cat: 'kebab', name: '18. Kebab Doble', desc: 'Doble ración de carne', price: 6.00, img: 'fotos-menu/kebab.jpg', units: U('wrap', 'Kebab'), note: true },
  { id: 'k19', cat: 'kebab', name: '19. Kebab con Queso', desc: 'Con queso', price: 5.50, img: 'fotos-menu/kebab.jpg', units: U('wrap', 'Kebab'), note: true },
  { id: 'k20', cat: 'kebab', name: '20. Kebab Solo Carne y Salsa', desc: 'Sin ensalada, solo carne y salsa', price: 6.00, img: 'fotos-menu/kebab.jpg', units: U('wrapSolo', 'Kebab'), note: true },
  { id: 'k21', cat: 'kebab', name: '21. Kebab Falafel', desc: 'Vegetariano', price: 4.50, img: 'fotos-menu/kebab.jpg', units: U('falafel', 'Kebab Falafel'), note: true },
  { id: 'k22', cat: 'kebab', name: '22. Kebab French', desc: 'Con patatas dentro', price: 5.50, img: 'fotos-menu/kebab.jpg', units: U('wrap', 'Kebab'), note: true },

  /* ---------- DURUM ---------- */
  { id: 'd23', cat: 'durum', name: '23. Durum', desc: 'Pollo, ternera o mixto, con ensalada y salsa', price: 6.00, img: 'fotos-menu/durum.jpg', units: U('wrap', 'Durum'), note: true },
  { id: 'd24', cat: 'durum', name: '24. Durum Doble', desc: 'Doble ración de carne', price: 7.00, img: 'fotos-menu/durum.jpg', units: U('wrap', 'Durum'), note: true },
  { id: 'd25', cat: 'durum', name: '25. Durum con Queso', desc: 'Con queso', price: 6.50, img: 'fotos-menu/durum.jpg', units: U('wrap', 'Durum'), note: true },
  { id: 'd26', cat: 'durum', name: '26. Durum Solo Carne y Salsa', desc: 'Sin ensalada, solo carne y salsa', price: 7.00, img: 'fotos-menu/durum.jpg', units: U('wrapSolo', 'Durum'), note: true },
  { id: 'd27', cat: 'durum', name: '27. Durum Falafel', desc: 'Vegetariano', price: 5.50, img: 'fotos-menu/durum.jpg', units: U('falafel', 'Durum Falafel'), note: true },
  { id: 'd28', cat: 'durum', name: '28. Durum French', desc: 'Con patatas dentro', price: 6.50, img: 'fotos-menu/durum.jpg', units: U('wrap', 'Durum'), note: true },

  /* ---------- LAHMACUN ---------- */
  { id: 'l29', cat: 'lahmacun', name: '29. Lahmacun', desc: 'Pollo, ternera o mixto, con ensalada y salsa', price: 6.00, img: 'fotos-menu/lahmacun.jpg', units: U('wrap', 'Lahmacun'), note: true },
  { id: 'l30', cat: 'lahmacun', name: '30. Lahmacun Doble', desc: 'Doble ración de carne', price: 6.00, img: 'fotos-menu/lahmacun.jpg', units: U('wrap', 'Lahmacun'), note: true },
  { id: 'l31', cat: 'lahmacun', name: '31. Lahmacun con Queso', desc: 'Con queso', price: 6.00, img: 'fotos-menu/lahmacun.jpg', units: U('wrap', 'Lahmacun'), note: true },
  { id: 'l32', cat: 'lahmacun', name: '32. Lahmacun Solo Carne y Salsa', desc: 'Sin ensalada, solo carne y salsa', price: 6.00, img: 'fotos-menu/lahmacun.jpg', units: U('wrapSolo', 'Lahmacun'), note: true },
  { id: 'l33', cat: 'lahmacun', name: '33. Lahmacun Falafel', desc: 'Vegetariano', price: 6.00, img: 'fotos-menu/lahmacun.jpg', units: U('falafel', 'Lahmacun Falafel'), note: true },

  /* ---------- PLATOS ---------- */
  { id: 'p46', cat: 'platos', name: '46. Plato', desc: 'Pollo, ternera, mixto o falafel. Patatas o arroz, ensalada, salsa y pan', price: 6.50, img: 'fotos-menu/platos.jpg', units: U('plato', 'Plato', 1, { meats: ['Pollo', 'Ternera', 'Mixto', 'Falafel'] }) },
  { id: 'p48', cat: 'platos', name: 'Plato Especial', desc: 'Pollo, ternera o mixto, con patatas, arroz, salsa y pan', price: 7.50, img: 'fotos-menu/platos.jpg', units: U('platoNS', 'Plato') },
  { id: 'p49', cat: 'platos', name: '49. Plato Doble', desc: 'Doble de carne, patatas o arroz, salsa y pan', price: 7.00, img: 'fotos-menu/platos.jpg', units: U('plato', 'Plato') },

  /* ---------- RACIONES (sin opciones) ---------- */
  { id: 'r1', cat: 'raciones', name: 'Patatas Fritas', desc: 'Ración', price: 3.00 },
  { id: 'r2', cat: 'raciones', name: '35. Patatas con Queso', desc: 'Gratinadas con queso', price: 4.00 },
  { id: 'r3', cat: 'raciones', name: 'Ración de Arroz', desc: 'Ración', price: 3.00 },
  { id: 'r4', cat: 'raciones', name: 'Aros de Cebolla (5)', desc: '5 unidades', price: 3.50 },
  { id: 'r5', cat: 'raciones', name: 'Alitas con Patatas (6)', desc: '6 alitas de pollo con patatas', price: 6.00 },
  { id: 'r6', cat: 'raciones', name: '40. Nuggets (6)', desc: '6 unidades', price: 4.50 },
  { id: 'r7', cat: 'raciones', name: 'Nuggets con Patatas', desc: '6 nuggets con patatas', price: 5.50 },
  { id: 'r8', cat: 'raciones', name: 'Hamburguesa de Pollo', desc: 'Hamburguesa suelta', price: 4.00 },
  { id: 'r9', cat: 'raciones', name: 'Ración Falafel (5)', desc: '5 unidades', price: 3.50 },

  /* ---------- BEBIDAS (sin opciones) ---------- */
  { id: 'b1', cat: 'bebidas', name: 'Lata de Refresco', desc: '33 cl', price: 2.00 },
  { id: 'b2', cat: 'bebidas', name: 'Agua', desc: 'Botella pequeña', price: 1.50 },
  { id: 'b3', cat: 'bebidas', name: 'Agua 1,5L', desc: 'Botella grande', price: 2.50 },
  { id: 'b4', cat: 'bebidas', name: 'Coca-Cola 1,25L', desc: 'Botella', price: 3.50 },
  { id: 'b5', cat: 'bebidas', name: 'Coca-Cola 2L', desc: 'Botella familiar', price: 4.00 }
];

if (typeof module !== 'undefined') module.exports = { CATS, ITEMS, KINDS, DRINKS, HOURS };
