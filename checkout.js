// STORE DISPATCH COORDINATES: Khayelitsha, Cape Town
const STORE_COORDS = { lat: -34.02621, lng: 18.66644 };
let shippingFee = 60; // Standard local delivery fee R60
let subtotal = 0;

// Haversine Distance Calculation (Kilometers)
function getDistanceKm(lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - STORE_COORDS.lat) * (Math.PI / 180);
  const dLon = (lon2 - STORE_COORDS.lng) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(STORE_COORDS.lat * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

document.addEventListener("DOMContentLoaded", () => {
  const summaryContainer = document.getElementById("checkoutSummaryItems");
  const subtotalEl = document.getElementById("summarySubtotal");
  const totalEl = document.getElementById("summaryTotal");
  const shippingEl = document.getElementById("summaryShipping");
  const form = document.getElementById("checkoutForm");
  const geoBtn = document.getElementById("geoLocateBtn");
  const msgEl = document.getElementById("distanceMessage");

  // Load Cart Items
  const cart = JSON.parse(localStorage.getItem("sinatra_cart")) || [];

  if (cart.length === 0) {
    if (summaryContainer) {
      summaryContainer.innerHTML = '<p style="color: #aaa;">Your cart is empty. <a href="shop.html" style="color: #fff; text-decoration: underline;">Return to shop</a></p>';
    }
    if (subtotalEl) subtotalEl.textContent = "R0.00";
    if (totalEl) totalEl.textContent = "R0.00";
    return;
  }

  // Render Order Items
  function renderCartSummary() {
    subtotal = 0;
    if (!summaryContainer) return;

    summaryContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * (item.quantity || 1);
      subtotal += itemTotal;
      const itemImg = item.colorImage || item.image || 'images/IMG_9067.png';

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding: 10px 0; color: #ddd;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${itemImg}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #333;" />
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
              <div style="font-size: 0.8rem; color: #888;">Color: ${item.color || 'Standard'} | Size: ${item.size || 'One Size'} | Qty: ${item.quantity || 1}</div>
            </div>
          </div>
          <div style="font-weight: 600; font-size: 0.9rem;">R${itemTotal}.00</div>
        </div>
      `;
    }).join("");
  }

  renderCartSummary();

  // Recalculate Totals & Shipping
  function refreshTotals() {
    if (subtotal >= 600) {
      shippingFee = 0;
    }

    if (shippingEl) shippingEl.textContent = shippingFee === 0 ? "FREE" : `R${shippingFee}.00`;
    if (subtotalEl) subtotalEl.textContent = `R${subtotal}.00`;
    if (totalEl) totalEl.textContent = `R${(subtotal + shippingFee).toFixed(2)}`;
  }

  refreshTotals();

  // Suburb/City Text Check
  const suburbInput = document.getElementById("suburb");
  const cityInput = document.getElementById("city");

  function checkAddressForFreeDelivery() {
    const suburb = suburbInput ? suburbInput.value.toLowerCase().trim() : "";
    const city = cityInput ? cityInput.value.toLowerCase().trim() : "";

    const freeLocalAreas = [
      "khayelitsha", "mitchells plain", "mfuleni", 
      "mandalay", "blue downs", "kuils river", "philippi", "eyethu"
    ];

    const isLocalFree = freeLocalAreas.some(area => suburb.includes(area) || city.includes(area));

    if (isLocalFree || subtotal >= 600) {
      shippingFee = 0;
      if (msgEl) msgEl.innerHTML = `<span style="color: #25D366;">FREE Local Delivery Applied!</span>`;
    } else {
      shippingFee = 60;
      if (msgEl && suburb.length > 2) {
        msgEl.innerHTML = `<span style="color: #aaa;">Local delivery fee applied (R60.00).</span>`;
      }
    }

    refreshTotals();
  }

  if (suburbInput) suburbInput.addEventListener("keyup", checkAddressForFreeDelivery);
  if (cityInput) cityInput.addEventListener("keyup", checkAddressForFreeDelivery);

  // Current Location Button Handler
  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (msgEl) msgEl.textContent = "Geolocation is not supported by your browser.";
        return;
      }

      if (msgEl) msgEl.textContent = "Checking your location...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const distance = getDistanceKm(position.coords.latitude, position.coords.longitude);

          if (distance <= 12 || subtotal >= 600) {
            if (msgEl) msgEl.innerHTML = `<span style="color: #25D366;">You are <strong>${distance.toFixed(1)} km</strong> away — <strong>FREE Local Delivery applied!</strong></span>`;
            shippingFee = 0;
          } else {
            if (msgEl) msgEl.innerHTML = `<span style="color: #ff9800;">You are <strong>${distance.toFixed(1)} km</strong> away — Standard delivery fee applies (R60.00).</span>`;
            shippingFee = 60;
          }
          refreshTotals();
        },
        () => {
          if (msgEl) msgEl.textContent = "Unable to retrieve location. Standard delivery fee applies (R60.00).";
        }
      );
    });
  }

  // Form Submit Handler
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.place-order-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'REDIRECTING TO PAYFAST...';
      }

      const totalAmount = (subtotal + shippingFee).toFixed(2);
      const paymentId = 'SINATRA-' + Date.now();

      const cartSummaryText = cart.map(item => 
        `• ${item.name} (${item.color || 'Standard'}, ${item.size || 'One Size'}) x${item.quantity || 1} - R${item.price * (item.quantity || 1)}.00`
      ).join("\n");

      // Save order details for success.html email dispatch
      const orderDetails = {
        access_key: "0200f736-cd68-4ffa-aadc-55892755d561",
        subject: `Paid Order [${paymentId}] - Sinatra Headwear`,
        from_name: "Sinatra Headwear Store",
        paymentId: paymentId,
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        apartment: document.getElementById('apartment').value || 'N/A',
        suburb: document.getElementById('suburb').value,
        city: document.getElementById('city').value,
        province: document.getElementById('province').value,
        postalCode: document.getElementById('postalCode').value,
        orderItems: cartSummaryText,
        subtotal: `R${subtotal}.00`,
        shippingFee: shippingFee === 0 ? 'FREE' : `R${shippingFee}.00`,
        totalAmount: `R${totalAmount}`
      };

      localStorage.setItem('pendingSinatraOrder', JSON.stringify(orderDetails));

      // Fill hidden PayFast inputs
      document.getElementById("pf_payment_id").value = paymentId;
      document.getElementById("pf_amount").value = totalAmount;
      document.getElementById("pf_item_name").value = "Sinatra Headwear Order";
      document.getElementById("pf_email").value = orderDetails.email;
      document.getElementById("pf_first_name").value = orderDetails.fullName;

      // Submit PayFast Form
      document.getElementById("payfastForm").submit();
    });
  }
});
