// =====================================================================
// SuliManor Collection — storefront logic
// =====================================================================

document.getElementById("year").textContent = new Date().getFullYear();

let allProducts = [];
let activeCategory = "All";
let cart = {}; // { productId: { id, name, price, qty } }

const grid = document.getElementById("grid");
const filtersEl = document.getElementById("filters");
const countEl = document.getElementById("product-count");

function money(n){
  const amount = Number(n).toLocaleString();
  const c = SHOP_SETTINGS.currency;
  return /^[A-Za-z]{2,}$/.test(c) ? `${amount} ${c}` : `${c}${amount}`;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Render catalog ----------
function renderFilters(){
  const cats = ["All", ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-pill ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  filtersEl.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid(){
  const visible = activeCategory === "All"
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory);

  countEl.textContent = visible.length
    ? `${visible.length} piece${visible.length === 1 ? "" : "s"} available`
    : "";

  if (!visible.length){
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="seal lg">SM</div>
        <h3>Nothing here yet</h3>
        <p>New pieces are added regularly — check back soon.</p>
      </div>`;
    return;
  }

  grid.innerHTML = visible.map(p => {
    const inCart = !!cart[p.id];
    return `
    <article class="card">
      <div class="card-media">
        ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">` : `<div class="seal lg">SM</div>`}
      </div>
      <div class="card-body">
        ${p.category ? `<span class="card-cat">${escapeHtml(p.category)}</span>` : ""}
        <h3 class="card-name">${escapeHtml(p.name)}</h3>
        <p class="card-price">${money(p.price)}</p>
        <button class="card-order ${inCart ? "in-cart" : ""}" data-id="${p.id}">
          ${inCart ? "Added — Add Another" : "Add to Cart"}
        </button>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".card-order").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

// ---------- Live data from Firestore ----------
db.collection("products").where("available", "==", true)
  .onSnapshot(snap => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFilters();
    renderGrid();
  }, err => {
    console.error("Could not load products:", err);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="seal lg">SM</div>
      <h3>Catalog unavailable</h3>
      <p>${escapeHtml(err.message || "Please check back shortly.")}</p>
    </div>`;
  });

// ---------- Cart logic ----------
function addToCart(productId){
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  if (cart[productId]) {
    cart[productId].qty += 1;
  } else {
    cart[productId] = { id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 };
  }
  updateCartUI();
  renderGrid();
}

function changeQty(productId, delta){
  if (!cart[productId]) return;
  cart[productId].qty += delta;
  if (cart[productId].qty <= 0) delete cart[productId];
  updateCartUI();
  renderCartItems();
  renderGrid();
}

function removeFromCart(productId){
  delete cart[productId];
  updateCartUI();
  renderCartItems();
  renderGrid();
}

function cartCount(){
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}
function cartTotal(){
  return Object.values(cart).reduce((sum, item) => sum + item.qty * item.price, 0);
}

const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const cartTotalRow = document.getElementById("cart-total-row");
const cartTotalAmount = document.getElementById("cart-total-amount");

function updateCartUI(){
  const count = cartCount();
  if (count > 0){
    cartCountEl.style.display = "flex";
    cartCountEl.textContent = count;
    checkoutBtn.disabled = false;
    cartTotalRow.style.display = "flex";
    cartTotalAmount.textContent = money(cartTotal());
  } else {
    cartCountEl.style.display = "none";
    checkoutBtn.disabled = true;
    cartTotalRow.style.display = "none";
  }
}

function renderCartItems(){
  const itemsEl = document.getElementById("cart-items");
  const items = Object.values(cart);
  if (!items.length){
    itemsEl.innerHTML = `<div class="cart-empty">Your cart is empty. Add a piece from the collection to get started.</div>`;
    return;
  }
  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      ${item.image ? `<img src="${item.image}" alt="">` : `<div class="seal" style="width:54px;height:64px;">SM</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">${money(item.price)} each</div>
      </div>
      <div class="qty-control">
        <button data-action="dec">−</button>
        <span>${item.qty}</span>
        <button data-action="inc">+</button>
      </div>
      <button class="cart-remove" data-action="remove">Remove</button>
    </div>
  `).join("");

  itemsEl.querySelectorAll(".cart-item").forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(id, 1));
    row.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(id, -1));
    row.querySelector('[data-action="remove"]').addEventListener("click", () => removeFromCart(id));
  });
}

// ---------- Cart modal open/close ----------
const cartOverlay = document.getElementById("cart-overlay");
document.getElementById("cart-open-btn").addEventListener("click", () => {
  renderCartItems();
  cartOverlay.style.display = "flex";
});
document.getElementById("cart-close").addEventListener("click", () => cartOverlay.style.display = "none");
cartOverlay.addEventListener("click", e => { if (e.target === cartOverlay) cartOverlay.style.display = "none"; });

// ---------- Checkout modal ----------
const checkoutOverlay = document.getElementById("checkout-overlay");
const orderSummaryEl = document.getElementById("order-summary");
const checkoutOptionsEl = document.getElementById("checkout-options");

checkoutBtn.addEventListener("click", () => {
  if (!cartCount()) return;
  cartOverlay.style.display = "none";
  renderOrderSummary();
  checkoutOverlay.style.display = "flex";
});
document.getElementById("checkout-close").addEventListener("click", () => checkoutOverlay.style.display = "none");
checkoutOverlay.addEventListener("click", e => { if (e.target === checkoutOverlay) checkoutOverlay.style.display = "none"; });

function renderOrderSummary(){
  const items = Object.values(cart);
  orderSummaryEl.innerHTML = items.map(item =>
    `<div><span>${escapeHtml(item.name)} × ${item.qty}</span><span>${money(item.price * item.qty)}</span></div>`
  ).join("") + `<div style="font-weight:700; border-top:1px solid var(--line); margin-top:6px; padding-top:6px;"><span>Total</span><span>${money(cartTotal())}</span></div>`;

  renderCheckoutOptions();
}

function buildOrderMessage(){
  const name = document.getElementById("customer-name").value.trim();
  const location = document.getElementById("customer-location").value.trim();
  const items = Object.values(cart);

  let msg = `Hi SuliManor Collection! I'd like to order:\n\n`;
  items.forEach(item => {
    msg += `• ${item.name} × ${item.qty} — ${money(item.price * item.qty)}\n`;
  });
  msg += `\nTotal: ${money(cartTotal())}\n`;
  if (name) msg += `\nName: ${name}`;
  if (location) msg += `\nDelivery location: ${location}`;
  return msg;
}

async function copyAndOpen(url){
  const message = buildOrderMessage();
  try{
    await navigator.clipboard.writeText(message);
  }catch(e){
    // Clipboard may fail without https/permissions; proceed anyway.
  }
  window.open(url, "_blank", "noopener");
}

function renderCheckoutOptions(){
  checkoutOptionsEl.innerHTML = `
    <button class="btn btn-primary" id="order-whatsapp">Send via WhatsApp</button>
    <button class="btn btn-outline" id="order-instagram">Send via Instagram</button>
    <button class="btn btn-outline" id="order-facebook">Send via Facebook</button>
    <button class="btn btn-gold" id="order-viber">Send via Viber</button>
  `;

  document.getElementById("order-whatsapp").addEventListener("click", () => {
    const message = buildOrderMessage();
    copyAndOpen(`https://wa.me/${SHOP_SETTINGS.whatsappNumber}?text=${encodeURIComponent(message)}`);
  });
  document.getElementById("order-instagram").addEventListener("click", () => {
    copyAndOpen(`https://ig.me/m/${SHOP_SETTINGS.instagramUsername}`);
  });
  document.getElementById("order-facebook").addEventListener("click", () => {
    copyAndOpen(`https://m.me/${SHOP_SETTINGS.facebookUsername}`);
  });
  document.getElementById("order-viber").addEventListener("click", () => {
    copyAndOpen(`viber://chat?number=${encodeURIComponent(SHOP_SETTINGS.viberNumber)}`);
  });
}

// ---------- General contact buttons (footer section) ----------
document.getElementById("contact-buttons").innerHTML = `
  <a class="btn btn-primary" target="_blank" rel="noopener" href="https://wa.me/${SHOP_SETTINGS.whatsappNumber}?text=${encodeURIComponent('Hi SuliManor Collection! I have a question.')}">Message on WhatsApp</a>
  <a class="btn btn-outline" target="_blank" rel="noopener" href="https://ig.me/m/${SHOP_SETTINGS.instagramUsername}">Message on Instagram</a>
  <a class="btn btn-outline" target="_blank" rel="noopener" href="https://m.me/${SHOP_SETTINGS.facebookUsername}">Message on Facebook</a>
`;
