
document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // SINATRA HEADWEAR - BLACK FRIDAY
  // ==========================================

  const products = [
  {
    id: 1,
    name: "Sinatra Skullie",
    category: "skullcaps",
    originalPrice: 209,
    price: 100,
    image: "IMG_9067.png",
    colors: ["Black", "Grey"],
    colorImages: {
      "Black": "IMG_9074.png",
      "Grey": "IMG_9067.png"
    },
    sizes: ["One Size"],
    stock: 20,
    inStock: true
  },
  {
    id: 2,
    name: "SNT Beanie",
    category: "beanies",
    originalPrice: 139,
    price: 69.50,
    image: "IMG_9081.png",
    colors: ["Black", "Grey"],
    colorImages: {
      "Black": "IMG_9075.png",
      "Grey": "IMG_9081.png"
    },
    sizes: ["One Size"],
    stock: 0,
    inStock: false
  },
  {
    id: 3,
    name: "SNT Trucker Cap",
    category: "caps",
    originalPrice: 279,
    price: 139.50,
    image: "IMG_9076.png",
    colors: ["Olive"],
    colorImages: {
      "Olive": "IMG_9076.png"
    },
    sizes: ["One Size"],
    stock: 0,
    inStock: false
  }
];

  // ==========================================
  // ELEMENTS
  // ==========================================

  const menuBtn = document.getElementById("menuBtn");
  const closeMenu = document.getElementById("closeMenu");
  const menuPanel = document.getElementById("menuPanel");

  const cartBtn = document.getElementById("cartBtn");
  const closeCart = document.getElementById("closeCart");
  const cartPanel = document.getElementById("cartPanel");

  const cartCount = document.getElementById("cartCount");
  const cartItemsContainer = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  const shopToggle = document.getElementById("shopToggle");
  const shopLinks = document.getElementById("shopLinks");

  const optionsModal = document.getElementById("optionsModal");
  const closeModalX = document.getElementById("closeModalX");
  const confirmAddToCartBtn =
    document.getElementById("confirmAddToCartBtn");

  const cartToast = document.getElementById("cartToast");

  const colorSelect = document.getElementById("colorSelect");
  const sizeSelect = document.getElementById("sizeSelect");
  const quantityInput = document.getElementById("quantityInput");

  const productGrid = document.getElementById("productGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const categoryTitle = document.getElementById("categoryTitle");

  let selectedProductForModal = null;
  let cart = [];

  // ==========================================
  // LOAD CART
  // ==========================================

  try {
    cart = JSON.parse(localStorage.getItem("sinatra_cart")) || [];
    if (!Array.isArray(cart)) cart = [];
  } catch (error) {
    cart = [];
  }

  // Always use the current Black Friday prices.
  cart = cart.map(item => {
    const matchingProduct = products.find(
      product => product.id === Number(item.id)
    );

    if (!matchingProduct) return item;

    return {
      ...item,
      price: matchingProduct.price,
      originalPrice: matchingProduct.originalPrice
    };
  });

  // ==========================================
  // PRICE FORMATTING
  // ==========================================

  function formatPrice(amount) {
    return `R${Number(amount).toFixed(2)}`;
  }

  // ==========================================
  // CART DISPLAY
  // ==========================================

  function updateCartUI() {
    const totalQty = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0
    );

    if (cartCount) {
      cartCount.textContent = totalQty;
    }

    localStorage.setItem(
      "sinatra_cart",
      JSON.stringify(cart)
    );

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<p class="empty-msg">Your cart is empty.</p>';

      if (cartTotal) {
        cartTotal.textContent = "R0.00";
      }

      return;
    }

    let total = 0;

    cartItemsContainer.innerHTML = cart.map((item, index) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const itemTotal = price * quantity;

      total += itemTotal;

      const itemImg =
        item.colorImage || item.image || "IMG_9067.png";

      return `
        <div class="cart-item">

          <div class="cart-item-details">

            <img
              src="${itemImg}"
              alt="${item.name}"
              class="cart-item-image"
            >

            <div>
              <div class="cart-item-name">${item.name}</div>

              <div class="cart-item-options">
                Color: ${item.color || "Standard"}
                | Size: ${item.size || "One Size"}
                | Qty: ${quantity}
              </div>

              <div class="cart-item-sale-price">
                ${formatPrice(itemTotal)}
              </div>

              <div class="cart-item-sale-label">
                BLACK FRIDAY PRICE
              </div>
            </div>

          </div>

          <button
            class="remove-cart-item"
            data-index="${index}"
            aria-label="Remove ${item.name}"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

        </div>
      `;
    }).join("");

    if (cartTotal) {
      cartTotal.textContent = formatPrice(total);
    }
  }

  // Remove products from cart
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener("click", event => {
      const removeBtn = event.target.closest(".remove-cart-item");

      if (!removeBtn) return;

      const index = Number(removeBtn.dataset.index);

      if (!Number.isInteger(index)) return;

      cart.splice(index, 1);
      updateCartUI();
    });
  }

  // ==========================================
  // MENU AND CART DRAWERS
  // ==========================================

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", () => {
      menuPanel.classList.add("active");
    });
  }

  if (closeMenu && menuPanel) {
    closeMenu.addEventListener("click", () => {
      menuPanel.classList.remove("active");
    });
  }

  if (cartBtn && cartPanel) {
    cartBtn.addEventListener("click", () => {
      cartPanel.classList.add("active");
    });
  }

  if (closeCart && cartPanel) {
    closeCart.addEventListener("click", () => {
      cartPanel.classList.remove("active");
    });
  }

  // ==========================================
  // SHOP SUB-MENU
  // ==========================================

  if (shopToggle && shopLinks) {
    shopToggle.addEventListener("click", () => {
      const isOpen = shopLinks.style.display === "block";

      shopLinks.style.display = isOpen ? "none" : "block";
    });
  }

  // ==========================================
  // PRODUCT DISPLAY
  // ==========================================

  function renderProducts(category = "all") {
    if (!productGrid) return;

    const filteredProducts = category === "all"
      ? products
      : products.filter(product => product.category === category);

    productGrid.innerHTML = filteredProducts.map(product => {
      const soldOut =
        !product.inStock || product.stock <= 0;

      return `
        <div class="product-card ${soldOut ? "out-of-stock" : ""}">

          <div class="product-image-box">

            <img
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
            >

            <span class="sale-badge">
              BLACK FRIDAY
            </span>

            ${
  soldOut
    ? '<span class="sold-out-badge">SOLD OUT</span>'
    : ''
}

          </div>

          <div class="product-title">
            ${product.name}
          </div>

          <div class="product-prices">

            <span class="original-price">
              ${formatPrice(product.originalPrice)}
            </span>

            <span class="sale-price">
              ${formatPrice(product.price)}
            </span>

          </div>

          <button
            class="add-cart-btn"
            data-product-id="${product.id}"
            ${soldOut ? "disabled" : ""}
          >
            ${soldOut ? "SOLD OUT" : "ADD TO CART"}
          </button>

        </div>
      `;
    }).join("");

    // Add-to-cart button events
    productGrid.querySelectorAll(".add-cart-btn").forEach(button => {
      button.addEventListener("click", () => {
        const productId = Number(button.dataset.productId);

        const product = products.find(
          item => item.id === productId
        );

        if (!product || !product.inStock || product.stock <= 0) {
          return;
        }

        openProductOptions(product);
      });
    });
  }

  // ==========================================
  // CATEGORY FILTERS
  // ==========================================

  function updateCategoryTitle(category) {
    if (!categoryTitle) return;

    const titles = {
      all: "ALL HEADWEAR",
      beanies: "BEANIES",
      skullcaps: "SKULL CAPS",
      caps: "CAPS"
    };

    categoryTitle.textContent =
      titles[category] || "ALL HEADWEAR";
  }

  if (filterBtns.length > 0) {
    filterBtns.forEach(button => {
      button.addEventListener("click", () => {
        filterBtns.forEach(btn => {
          btn.classList.remove("active");
        });

        button.classList.add("active");

        const category = button.dataset.category || "all";

        renderProducts(category);
        updateCategoryTitle(category);
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");

    const validCategories = [
      "all",
      "beanies",
      "skullcaps",
      "caps"
    ];

    const startingCategory =
      validCategories.includes(categoryParam)
        ? categoryParam
        : "all";

    filterBtns.forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.category === startingCategory
      );
    });

    renderProducts(startingCategory);
    updateCategoryTitle(startingCategory);
  }

  // ==========================================
  // PRODUCT OPTIONS MODAL
  // ==========================================

  function openProductOptions(product) {
    if (!optionsModal) return;

    selectedProductForModal = product;

    if (colorSelect) {
      colorSelect.innerHTML = product.colors.map(color => `
        <option value="${color}">${color}</option>
      `).join("");
    }

    if (sizeSelect) {
      sizeSelect.innerHTML = product.sizes.map(size => `
        <option value="${size}">${size}</option>
      `).join("");
    }

    if (quantityInput) {
      quantityInput.value = 1;
      quantityInput.min = 1;
      quantityInput.max = product.stock;
    }

    optionsModal.classList.remove("hidden");
  }

  function closeOptionsModal() {
    if (optionsModal) {
      optionsModal.classList.add("hidden");
    }

    selectedProductForModal = null;
  }

  if (closeModalX) {
    closeModalX.addEventListener("click", closeOptionsModal);
  }

  if (optionsModal) {
    optionsModal.addEventListener("click", event => {
      if (event.target === optionsModal) {
        closeOptionsModal();
      }
    });
  }

  // ==========================================
  // ADD PRODUCT TO CART
  // ==========================================

  if (confirmAddToCartBtn) {
    confirmAddToCartBtn.addEventListener("click", () => {
      if (!selectedProductForModal) return;

      const product = selectedProductForModal;

      const selectedColor = colorSelect
        ? colorSelect.value
        : "Standard";

      const selectedSize = sizeSelect
        ? sizeSelect.value
        : "One Size";

      let selectedQty = quantityInput
        ? parseInt(quantityInput.value, 10) || 1
        : 1;

      selectedQty = Math.max(
        1,
        Math.min(selectedQty, product.stock)
      );

      const chosenColorImg =
        product.colorImages &&
        product.colorImages[selectedColor]
          ? product.colorImages[selectedColor]
          : product.image;

      // Check whether the same variant is already in the cart
      const existingItem = cart.find(item =>
        item.id === product.id &&
        item.color === selectedColor &&
        item.size === selectedSize
      );

      const currentQuantity = existingItem
        ? Number(existingItem.quantity || 1)
        : 0;

      if (currentQuantity + selectedQty > product.stock) {
        alert(
          `Only ${product.stock} ${product.name}(s) are available.`
        );
        return;
      }

      if (existingItem) {
        existingItem.quantity = currentQuantity + selectedQty;
      } else {
        cart.push({
          ...product,
          price: product.price,
          originalPrice: product.originalPrice,
          color: selectedColor,
          colorImage: chosenColorImg,
          size: selectedSize,
          quantity: selectedQty
        });
      }

      updateCartUI();
      closeOptionsModal();

      if (cartToast) {
        cartToast.classList.remove("hidden");

        setTimeout(() => {
          cartToast.classList.add("hidden");
        }, 3000);
      }
    });
  }

  // ==========================================
  // INITIALISE
  // ==========================================

  updateCartUI();

});
