document.addEventListener("DOMContentLoaded", () => {
  // Navigation & Cart Elements
  const menuBtn = document.getElementById("menuBtn");
  const closeMenu = document.getElementById("closeMenu");
  const menuPanel = document.getElementById("menuPanel");

  const cartBtn = document.getElementById("cartBtn");
  const closeCart = document.getElementById("closeCart");
  const cartPanel = document.getElementById("cartPanel");

  const cartCount = document.getElementById("cartCount");
  const cartItemsContainer = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  // Shop sub-menu toggle
  const shopToggle = document.getElementById("shopToggle");
  const shopLinks = document.getElementById("shopLinks");

  if (shopToggle && shopLinks) {
    shopToggle.addEventListener("click", () => {
      shopLinks.style.display = shopLinks.style.display === "block" ? "none" : "block";
    });
  }

  // Modal & Toast Elements
  const optionsModal = document.getElementById("optionsModal");
  const closeModalX = document.getElementById("closeModalX");
  const confirmAddToCartBtn = document.getElementById("confirmAddToCartBtn");
  const cartToast = document.getElementById("cartToast");

  const colorSelect = document.getElementById("colorSelect");
  const sizeSelect = document.getElementById("sizeSelect");
  const quantityInput = document.getElementById("quantityInput");

  let selectedProductForModal = null;

  // Sample Product Data with Stock & Color Image Mappings
  const products = [
    { 
      id: 1, 
      name: "Sinatra Skullie", 
      category: "skullcaps", 
      price: 209, 
      image: "images/IMG_9067.png",
      colors: ["Black", "Grey"],
      colorImages: {
        "Black": "images/IMG_9067.png",
        "Grey": "images/IMG_9081.png"
      },
      sizes: ["One Size"],
      stock: 5,
      inStock: true
    },
    { 
      id: 2, 
      name: "SNT Beanie", 
      category: "beanies", 
      price: 139, 
      image: "images/IMG_9081.png",
      colors: ["Black", "Grey"],
      colorImages: {
        "Black": "images/IMG_9081.png",
        "Grey": "images/IMG_9067.png"
      },
      sizes: ["One Size"],
      stock: 0,
      inStock: false
    },
    { 
      id: 3, 
      name: "SNT Trucker Cap", 
      category: "caps", 
      price: 279, 
      image: "images/IMG_9076.png",
      colors: ["Olive"],
      colorImages: {
        "Olive": "images/IMG_9076.png"
      },
      sizes: ["One Size"],
      stock: 0,
      inStock: false
    }
  ];

  let cart = JSON.parse(localStorage.getItem("sinatra_cart")) || [];

  // Update Cart Display & LocalStorage (Includes Cart Image Thumbnails)
  function updateCartUI() {
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) cartCount.textContent = totalQty;
    localStorage.setItem("sinatra_cart", JSON.stringify(cart));

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
      if (cartTotal) cartTotal.textContent = "R0.00";
      return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cart.map((item, index) => {
      const itemTotal = item.price * (item.quantity || 1);
      total += itemTotal;
      const itemImg = item.colorImage || item.image || 'images/IMG_9067.png';

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid #222;">
          <div style="display:flex; align-items:center; gap: 10px;">
            <img src="${itemImg}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid #333;" />
            <div>
              <div style="font-weight:700; font-size:13px; color:#fff;">${item.name}</div>
              <div style="color:#aaa; font-size:11px;">Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity}</div>
              <div style="color:#888; font-size:12px;">R${itemTotal}.00</div>
            </div>
          </div>
          <button onclick="removeCartItem(${index})" style="background:none; border:none; color:#ff4444; cursor:pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join("");

    if (cartTotal) cartTotal.textContent = `R${total}.00`;
  }

  window.removeCartItem = (index) => {
    cart.splice(index, 1);
    updateCartUI();
  };

  // Drawers Toggle
  if (menuBtn) menuBtn.addEventListener("click", () => menuPanel.classList.add("active"));
  if (closeMenu) closeMenu.addEventListener("click", () => menuPanel.classList.remove("active"));

  if (cartBtn) cartBtn.addEventListener("click", () => cartPanel.classList.add("active"));
  if (closeCart) closeCart.addEventListener("click", () => cartPanel.classList.remove("active"));

  // Render Products
  const productGrid = document.getElementById("productGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");

  function renderProducts(category = "all") {
    if (!productGrid) return;

    const filtered = category === "all" 
      ? products 
      : products.filter(p => p.category === category);

    productGrid.innerHTML = filtered.map(p => {
      const isOutOfStock = p.inStock === false || p.stock <= 0;

      return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
          <div class="product-image-box">
            ${p.image ? `<img src="${p.image}" alt="${p.name}">` : '<i class="fa-solid fa-hat-cowboy"></i>'}
            ${isOutOfStock ? '<span class="sold-out-badge">SOLD OUT</span>' : ''}
          </div>
          <div class="product-title">${p.name}</div>
          <div class="product-price">R${p.price}.00</div>
          <button 
            class="add-cart-btn" 
            ${isOutOfStock ? 'disabled' : `onclick='openProductOptions(${JSON.stringify(p)})'`}
          >
            ${isOutOfStock ? 'SOLD OUT' : 'ADD TO CART'}
          </button>
        </div>
      `;
    }).join("");
  }

  // Opens modal when clicking "ADD TO CART" & Populates Options
  window.openProductOptions = (product) => {
    if (!product.inStock || product.stock <= 0) return;
    selectedProductForModal = product;

    // Populate colors dynamically
    if (colorSelect && product.colors) {
      colorSelect.innerHTML = product.colors.map(c => `<option value="${c}">${c}</option>`).join("");
    }

    // Restrict max quantity based on stock
    if (quantityInput) {
      quantityInput.value = 1;
      quantityInput.max = product.stock || 10;
    }

    if (optionsModal) {
      optionsModal.classList.remove("hidden");
    }
  };

  // Close Modal
  if (closeModalX) {
    closeModalX.addEventListener("click", () => {
      optionsModal.classList.add("hidden");
    });
  }

  if (optionsModal) {
    optionsModal.addEventListener("click", (e) => {
      if (e.target === optionsModal) {
        optionsModal.classList.add("hidden");
      }
    });
  }

  // Confirm Selection & Add to Cart
  if (confirmAddToCartBtn) {
    confirmAddToCartBtn.addEventListener("click", () => {
      if (!selectedProductForModal) return;

      const selectedColor = colorSelect ? colorSelect.value : "Standard";
      const selectedSize = sizeSelect ? sizeSelect.value : "One Size";
      const selectedQty = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

      // Select specific image for chosen color variant
      const chosenColorImg = selectedProductForModal.colorImages && selectedProductForModal.colorImages[selectedColor]
        ? selectedProductForModal.colorImages[selectedColor]
        : selectedProductForModal.image;

      cart.push({
        ...selectedProductForModal,
        color: selectedColor,
        colorImage: chosenColorImg,
        size: selectedSize,
        quantity: selectedQty
      });

      updateCartUI();
      optionsModal.classList.add("hidden");

      if (cartToast) {
        cartToast.classList.remove("hidden");
        setTimeout(() => {
          cartToast.classList.add("hidden");
        }, 3000);
      }
    });
  }

  // Filter Buttons Handler
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderProducts(btn.dataset.category);
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    if (categoryParam) {
      renderProducts(categoryParam);
      filterBtns.forEach(b => {
        b.classList.toggle("active", b.dataset.category === categoryParam);
      });
    } else {
      renderProducts("all");
    }
  }

  updateCartUI();
});
