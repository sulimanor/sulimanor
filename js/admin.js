// =====================================================================
// SuliManor Collection — Admin logic
// =====================================================================

const loginScreen = document.getElementById("login-screen");
const adminShell = document.getElementById("admin-shell");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const toastEl = document.getElementById("toast");

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 3200);
}

// ---------- Auth gate ----------
auth.onAuthStateChanged(user => {
  if (user){
    loginScreen.style.display = "none";
    adminShell.style.display = "block";
    listenToProducts();
  } else {
    loginScreen.style.display = "flex";
    adminShell.style.display = "none";
  }
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try{
    await auth.signInWithEmailAndPassword(email, password);
  }catch(err){
    // Show the real reason instead of a generic message, so issues are easy to spot.
    loginError.textContent = describeAuthError(err);
  }
});

function describeAuthError(err){
  switch(err.code){
    case "auth/invalid-email": return "That email address looks invalid.";
    case "auth/user-not-found": return "No admin account found with that email.";
    case "auth/wrong-password": return "Incorrect password.";
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts — please wait a moment and try again.";
    case "auth/network-request-failed": return "Network error — check your connection.";
    default: return err.message || "Sign-in failed. Please try again.";
  }
}

document.getElementById("logout-btn").addEventListener("click", () => auth.signOut());

// ---------- Image handling ----------
let pendingImageData = ""; // base64 data URL, compressed

const imageDrop = document.getElementById("image-drop");
const imageFileInput = document.getElementById("p-image-file");
const imagePreview = document.getElementById("image-preview");

imageDrop.addEventListener("click", () => imageFileInput.click());

imageFileInput.addEventListener("change", () => {
  const file = imageFileInput.files[0];
  if (!file) return;
  compressImage(file, 800, 0.72).then(dataUrl => {
    pendingImageData = dataUrl;
    imagePreview.src = dataUrl;
    imagePreview.style.display = "block";
    imageDrop.textContent = "Tap to change photo";
  }).catch(() => {
    showToast("Could not read that image — try a different file.");
  });
});

function compressImage(file, maxWidth, quality){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Add product ----------
const productForm = document.getElementById("product-form");
const saveBtn = document.getElementById("save-product-btn");

productForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("p-name").value.trim();
  const price = parseFloat(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value.trim();
  const notes = document.getElementById("p-notes").value.trim();

  if (!name || isNaN(price)){
    showToast("Please fill in at least a name and price.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try{
    await db.collection("products").add({
      name, price, category, notes,
      image: pendingImageData || "",
      available: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    productForm.reset();
    pendingImageData = "";
    imagePreview.style.display = "none";
    imageDrop.textContent = "Tap to choose a photo";
    showToast("Product added.");
  }catch(err){
    console.error(err);
    showToast("Could not add product: " + (err.message || "unknown error"));
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = "Add Product";
  }
});

// ---------- Live product table ----------
const tbody = document.getElementById("products-body");

function listenToProducts(){
  db.collection("products").orderBy("createdAt", "desc").onSnapshot(snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(rows);
  }, err => {
    console.error(err);
    showToast("Could not load products: " + (err.message || "unknown error"));
  });
}

function renderTable(rows){
  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6B6356; padding:24px;">No products yet — add your first one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(p => `
    <tr data-id="${p.id}">
      <td>${p.image ? `<img src="${p.image}" alt="">` : ""}</td>
      <td>${escapeHtml(p.name)}<br><span style="font-size:11px; color:#9A9282;">${escapeHtml(p.category||"")}</span></td>
      <td>${escapeHtml(p.category||"—")}</td>
      <td><input class="price-input" type="number" step="0.01" value="${p.price}" data-action="price"></td>
      <td><span class="tag ${p.available ? "live" : "hidden"}" data-action="toggle" style="cursor:pointer;">${p.available ? "Live" : "Hidden"}</span></td>
      <td><div class="row-actions"><button class="icon-btn danger" data-action="delete">Delete</button></div></td>
    </tr>
  `).join("");

  tbody.querySelectorAll('input[data-action="price"]').forEach(input => {
    input.addEventListener("change", async () => {
      const id = input.closest("tr").dataset.id;
      const newPrice = parseFloat(input.value);
      if (isNaN(newPrice)) return;
      await db.collection("products").doc(id).update({ price: newPrice });
      showToast("Price updated.");
    });
  });

  tbody.querySelectorAll('[data-action="toggle"]').forEach(tag => {
    tag.addEventListener("click", async () => {
      const id = tag.closest("tr").dataset.id;
      const isLive = tag.classList.contains("live");
      await db.collection("products").doc(id).update({ available: !isLive });
      showToast(isLive ? "Product hidden from shop." : "Product is live on shop.");
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      if (!confirm("Delete this product permanently?")) return;
      await db.collection("products").doc(id).delete();
      showToast("Product deleted.");
    });
  });
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
