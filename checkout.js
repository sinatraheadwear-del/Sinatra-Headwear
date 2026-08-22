// STORE DISPATCH COORDINATES: Khayelitsha, Cape Town
const STORE_COORDS = {
  lat: -34.02621,
  lng: 18.66644
};

const PAYFAST_CREATE_URL =
  "https://sinatra-headwear.vercel.app/api/create-payfast-payment";

let shippingFee = 60;
let subtotal = 0;

function getDistanceKm(lat2, lon2) {
  const R = 6371;

  const dLat =
    (lat2 - STORE_COORDS.lat) *
    (Math.PI / 180);

  const dLon =
    (lon2 - STORE_COORDS.lng) *
    (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      STORE_COORDS.lat *
      (Math.PI / 180)
    ) *
      Math.cos(
        lat2 *
        (Math.PI / 180)
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const summaryContainer =
      document.getElementById(
        "checkoutSummaryItems"
      );

    const subtotalEl =
      document.getElementById(
        "summarySubtotal"
      );

    const totalEl =
      document.getElementById(
        "summaryTotal"
      );

    const shippingEl =
      document.getElementById(
        "summaryShipping"
      );

    const form =
      document.getElementById(
        "checkoutForm"
      );

    const geoBtn =
      document.getElementById(
        "geoLocateBtn"
      );

    const msgEl =
      document.getElementById(
        "distanceMessage"
      );

    const cart =
      JSON.parse(
        localStorage.getItem(
          "sinatra_cart"
        )
      ) || [];

    if (cart.length === 0) {
      if (summaryContainer) {
        summaryContainer.innerHTML = `
          <p style="color:#aaa;">
            Your cart is empty.
            <a
              href="shop.html"
              style="color:#fff;text-decoration:underline;"
            >
              Return to shop
            </a>
          </p>
        `;
      }

      if (subtotalEl) {
        subtotalEl.textContent =
          "R0.00";
      }

      if (totalEl) {
        totalEl.textContent =
          "R0.00";
      }

      return;
    }

    function renderCartSummary() {
      subtotal = 0;

      if (!summaryContainer) {
        return;
      }

      summaryContainer.innerHTML =
        cart.map(item => {
          const quantity =
            Number(item.quantity || 1);

          const price =
            Number(item.price || 0);

          const itemTotal =
            price * quantity;

          subtotal += itemTotal;

          const itemImg =
            item.colorImage ||
            item.image ||
            "IMG_9067.png";

          return `
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                border-bottom:1px solid #222;
                padding:10px 0;
                color:#ddd;
              "
            >
              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:12px;
                "
              >
                <img
                  src="${itemImg}"
                  alt="${item.name}"
                  style="
                    width:48px;
                    height:48px;
                    object-fit:cover;
                    border-radius:4px;
                    border:1px solid #333;
                  "
                >

                <div>
                  <div
                    style="
                      font-weight:600;
                      font-size:.9rem;
                    "
                  >
                    ${item.name}
                  </div>

                  <div
                    style="
                      font-size:.8rem;
                      color:#888;
                    "
                  >
                    Color:
                    ${item.color || "Standard"}
                    |
                    Size:
                    ${item.size || "One Size"}
                    |
                    Qty:
                    ${quantity}
                  </div>
                </div>
              </div>

              <div
                style="
                  font-weight:600;
                  font-size:.9rem;
                "
              >
                R${itemTotal.toFixed(2)}
              </div>
            </div>
          `;
        }).join("");
    }

    renderCartSummary();

    function refreshTotals() {
      if (subtotal >= 600) {
        shippingFee = 0;
      }

      if (shippingEl) {
        shippingEl.textContent =
          shippingFee === 0
            ? "FREE"
            : `R${shippingFee.toFixed(2)}`;
      }

      if (subtotalEl) {
        subtotalEl.textContent =
          `R${subtotal.toFixed(2)}`;
      }

      if (totalEl) {
        totalEl.textContent =
          `R${(
            subtotal +
            shippingFee
          ).toFixed(2)}`;
      }
    }

    refreshTotals();

    const suburbInput =
      document.getElementById(
        "suburb"
      );

    const cityInput =
      document.getElementById(
        "city"
      );

    function checkAddressForFreeDelivery() {
      const suburb =
        suburbInput
          ? suburbInput.value
              .toLowerCase()
              .trim()
          : "";

      const city =
        cityInput
          ? cityInput.value
              .toLowerCase()
              .trim()
          : "";

      const freeLocalAreas = [
        "khayelitsha",
        "harare",
        "mandela park",
        "makhaza",
        "kuyasa",
        "mitchells plain",
        "mfuleni",
        "mandalay",
        "blue downs",
        "kuils river",
        "philippi",
        "eyethu"
      ];

      const isLocalFree =
        freeLocalAreas.some(
          area =>
            suburb.includes(area) ||
            city.includes(area)
        );

      if (
        isLocalFree ||
        subtotal >= 600
      ) {
        shippingFee = 0;

        if (msgEl) {
          msgEl.innerHTML = `
            <span style="color:#25D366;">
              FREE Local Delivery Applied!
            </span>
          `;
        }
      } else {
        shippingFee = 60;

        if (
          msgEl &&
          suburb.length > 2
        ) {
          msgEl.innerHTML = `
            <span style="color:#aaa;">
              Local delivery fee applied
              (R60.00).
            </span>
          `;
        }
      }

      refreshTotals();
    }

    if (suburbInput) {
      suburbInput.addEventListener(
        "keyup",
        checkAddressForFreeDelivery
      );
    }

    if (cityInput) {
      cityInput.addEventListener(
        "keyup",
        checkAddressForFreeDelivery
      );
    }

    if (geoBtn) {
      geoBtn.addEventListener(
        "click",
        () => {
          if (!navigator.geolocation) {
            if (msgEl) {
              msgEl.textContent =
                "Geolocation is not supported by your browser.";
            }

            return;
          }

          if (msgEl) {
            msgEl.textContent =
              "Checking your location...";
          }

          navigator.geolocation
            .getCurrentPosition(
              position => {
                const distance =
                  getDistanceKm(
                    position.coords
                      .latitude,
                    position.coords
                      .longitude
                  );

                if (
                  distance <= 12 ||
                  subtotal >= 600
                ) {
                  shippingFee = 0;

                  if (msgEl) {
                    msgEl.innerHTML = `
                      <span style="color:#25D366;">
                        You are
                        <strong>
                          ${distance.toFixed(1)} km
                        </strong>
                        away —
                        <strong>
                          FREE Local Delivery applied!
                        </strong>
                      </span>
                    `;
                  }
                } else {
                  shippingFee = 60;

                  if (msgEl) {
                    msgEl.innerHTML = `
                      <span style="color:#ff9800;">
                        You are
                        <strong>
                          ${distance.toFixed(1)} km
                        </strong>
                        away —
                        Standard delivery fee
                        applies (R60.00).
                      </span>
                    `;
                  }
                }

                refreshTotals();
              },

              () => {
                if (msgEl) {
                  msgEl.textContent =
                    "Unable to retrieve location. Standard delivery fee applies (R60.00).";
                }
              }
            );
        }
      );
    }

    if (form) {
      form.addEventListener(
        "submit",
        async event => {
          event.preventDefault();

          const submitBtn =
            form.querySelector(
              ".place-order-btn"
            );

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText =
              "REDIRECTING TO PAYFAST...";
          }

          try {
            const totalAmount =
              (
                subtotal +
                shippingFee
              ).toFixed(2);

            const paymentId =
              "SINATRA-" +
              Date.now();

            const fullName =
              document
                .getElementById(
                  "fullName"
                )
                .value
                .trim();

            const email =
              document
                .getElementById(
                  "email"
                )
                .value
                .trim();

            const phone =
              document
                .getElementById(
                  "phone"
                )
                .value
                .trim();

            const address =
              document
                .getElementById(
                  "address"
                )
                .value
                .trim();

            const apartment =
              document
                .getElementById(
                  "apartment"
                )
                .value
                .trim() ||
              "N/A";

            const suburb =
              document
                .getElementById(
                  "suburb"
                )
                .value
                .trim();

            const city =
              document
                .getElementById(
                  "city"
                )
                .value
                .trim();

            const province =
              document
                .getElementById(
                  "province"
                )
                .value
                .trim();

            const postalCode =
              document
                .getElementById(
                  "postalCode"
                )
                .value
                .trim();

            const names =
              fullName.split(/\s+/);

            const firstName =
              names.shift() || fullName;

            const lastName =
              names.join(" ");

            let payfastItemName =
              cart
                .map(item => {
                  const quantity =
                    item.quantity || 1;

                  return (
                    `${item.name} x${quantity}`
                  );
                })
                .join(", ");

            if (
              payfastItemName.length >
              100
            ) {
              payfastItemName =
                `Sinatra Order ${paymentId}`;
            }

            const itemDescription =
              cart
                .map(item => {
                  const quantity =
                    item.quantity || 1;

                  return (
                    `${item.name} - ` +
                    `${item.color || "Standard"} - ` +
                    `${item.size || "One Size"} - ` +
                    `Qty ${quantity}`
                  );
                })
                .join(" | ")
                .substring(0, 255);

            const orderItems =
              cart
                .map(item => {
                  const quantity =
                    Number(
                      item.quantity || 1
                    );

                  const itemTotal =
                    Number(
                      item.price || 0
                    ) *
                    quantity;

                  return (
                    `${item.name}\n` +
                    `Colour: ${item.color || "Standard"}\n` +
                    `Size: ${item.size || "One Size"}\n` +
                    `Quantity: ${quantity}\n` +
                    `Price: R${itemTotal.toFixed(2)}`
                  );
                })
                .join("\n\n");

            const orderDetails = {
              paymentId,
              fullName,
              email,
              phone,
              address,
              apartment,
              suburb,
              city,
              province,
              postalCode,
              orderItems,

              subtotal:
                `R${subtotal.toFixed(2)}`,

              shippingFee:
                shippingFee === 0
                  ? "FREE"
                  : `R${shippingFee.toFixed(2)}`,

              totalAmount:
                `R${totalAmount}`,

              itemName:
                payfastItemName,

              itemDescription
            };

            localStorage.setItem(
              "pendingSinatraOrder",
              JSON.stringify(
                orderDetails
              )
            );

            const response =
              await fetch(
                PAYFAST_CREATE_URL,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({
                      paymentId,
                      amount:
                        totalAmount,

                      firstName,
                      lastName,
                      email,
                      phone,

                      itemName:
                        payfastItemName,

                      itemDescription,

                      custom1:
                        phone,

                      custom2:
                        `${address}, ${apartment}`,

                      custom3:
                        `${suburb}, ${city}`,

                      custom4:
                        `${province}, ${postalCode}`,

                      custom5:
                        `Subtotal R${subtotal.toFixed(2)}; Shipping ${
                          shippingFee === 0
                            ? "FREE"
                            : `R${shippingFee.toFixed(2)}`
                        }`
                    })
                }
              );

            const result =
              await response.json();

            if (
              !response.ok ||
              !result.success
            ) {
              throw new Error(
                result.error ||
                "Could not create PayFast payment."
              );
            }

            const payfastForm =
              document.getElementById(
                "payfastForm"
              );

            payfastForm.innerHTML =
              "";

            payfastForm.action =
              result.processUrl;

            for (
              const [name, value]
              of Object.entries(
                result.fields
              )
            ) {
              const input =
                document.createElement(
                  "input"
                );

              input.type =
                "hidden";

              input.name =
                name;

              input.value =
                value;

              payfastForm.appendChild(
                input
              );
            }

            payfastForm.submit();

          } catch (error) {
            console.error(
              "Checkout error:",
              error
            );

            if (submitBtn) {
              submitBtn.disabled =
                false;

              submitBtn.innerText =
                "PROCEED TO PAYFAST";
            }

            alert(
              "We could not start your PayFast payment. Please try again."
            );
          }
        }
      );
    }
  }
);