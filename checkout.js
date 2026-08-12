// ============================================================
// SINATRA HEADWEAR — CHECKOUT
// Yoco Online Payments
// ============================================================


// STORE DISPATCH COORDINATES: Khayelitsha, Cape Town
const STORE_COORDS = {
  lat: -34.02621,
  lng: 18.66644
};


// Standard delivery fee
let shippingFee = 60;


// Order subtotal
let subtotal = 0;


// ============================================================
// HAVERSINE DISTANCE CALCULATION
// ============================================================

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


// ============================================================
// CHECKOUT PAGE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {


    // --------------------------------------------------------
    // GET ELEMENTS
    // --------------------------------------------------------

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

    const submitBtn =
      document.querySelector(
        ".place-order-btn"
      );

    const paymentError =
      document.getElementById(
        "paymentError"
      );


    // --------------------------------------------------------
    // LOAD CART
    // --------------------------------------------------------

    const cart =
      JSON.parse(
        localStorage.getItem(
          "sinatra_cart"
        )
      ) || [];


    // --------------------------------------------------------
    // EMPTY CART
    // --------------------------------------------------------

    if (cart.length === 0) {

      if (summaryContainer) {

        summaryContainer.innerHTML = `
          <p style="color: #aaa;">
            Your cart is empty.
            <a
              href="shop.html"
              style="
                color: #fff;
                text-decoration: underline;
              "
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


      if (shippingEl) {

        shippingEl.textContent =
          "R0.00";

      }


      if (submitBtn) {

        submitBtn.disabled =
          true;

      }


      return;

    }


    // ========================================================
    // RENDER CART SUMMARY
    // ========================================================

    function renderCartSummary() {

      subtotal = 0;


      if (!summaryContainer) {
        return;
      }


      summaryContainer.innerHTML =
        cart.map(
          (item) => {


            const quantity =
              item.quantity || 1;


            const price =
              Number(item.price) || 0;


            const itemTotal =
              price * quantity;


            subtotal +=
              itemTotal;


            const itemImg =
              item.colorImage ||
              item.image ||
              "images/IMG_9067.png";


            return `

              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #222;
                  padding: 10px 0;
                  color: #ddd;
                "
              >

                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                  "
                >

                  <img
                    src="${itemImg}"
                    alt="${item.name}"
                    style="
                      width: 48px;
                      height: 48px;
                      object-fit: cover;
                      border-radius: 4px;
                      border: 1px solid #333;
                    "
                  >

                  <div>

                    <div
                      style="
                        font-weight: 600;
                        font-size: 0.9rem;
                      "
                    >
                      ${item.name}
                    </div>


                    <div
                      style="
                        font-size: 0.8rem;
                        color: #888;
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
                    font-weight: 600;
                    font-size: 0.9rem;
                  "
                >
                  R${itemTotal.toFixed(2)}
                </div>

              </div>

            `;

          }
        )
        .join("");

    }


    renderCartSummary();


    // ========================================================
    // REFRESH TOTALS
    // ========================================================

    function refreshTotals() {


      // Orders of R600 or more are free delivery
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


    // ========================================================
    // ADDRESS CHECK
    // ========================================================

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
          (area) =>
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
            <span style="color: #25D366;">
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
            <span style="color: #aaa;">
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
        "input",
        checkAddressForFreeDelivery
      );

    }


    if (cityInput) {

      cityInput.addEventListener(
        "input",
        checkAddressForFreeDelivery
      );

    }


    // ========================================================
    // CURRENT LOCATION
    // ========================================================

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


          geoBtn.disabled =
            true;


          navigator.geolocation.getCurrentPosition(

            (position) => {


              const distance =
                getDistanceKm(
                  position.coords.latitude,
                  position.coords.longitude
                );


              if (
                distance <= 12 ||
                subtotal >= 600
              ) {


                shippingFee = 0;


                if (msgEl) {

                  msgEl.innerHTML = `
                    <span style="color: #25D366;">
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
                    <span style="color: #ff9800;">
                      You are
                      <strong>
                        ${distance.toFixed(1)} km
                      </strong>
                      away —
                      Standard delivery fee applies
                      (R60.00).
                    </span>
                  `;

                }

              }


              refreshTotals();


              geoBtn.disabled =
                false;

            },


            () => {


              shippingFee = 60;


              if (msgEl) {

                msgEl.textContent =
                  "Unable to retrieve location. Standard delivery fee applies (R60.00).";

              }


              refreshTotals();


              geoBtn.disabled =
                false;

            }

          );

        }
      );

    }


    // ========================================================
    // YOCO PAYMENT
    // ========================================================

    if (form) {


      form.addEventListener(
        "submit",
        async (e) => {


          e.preventDefault();


          // Clear previous error
          if (paymentError) {

            paymentError.style.display =
              "none";

            paymentError.textContent =
              "";

          }


          // Prevent double-clicking
          if (submitBtn) {

            submitBtn.disabled =
              true;

            submitBtn.innerText =
              "CONNECTING TO YOCO...";

          }


          try {


            // ------------------------------------------------
            // CUSTOMER DETAILS
            // ------------------------------------------------

            const customer = {

              fullName:
                document
                  .getElementById("fullName")
                  .value
                  .trim(),

              email:
                document
                  .getElementById("email")
                  .value
                  .trim(),

              phone:
                document
                  .getElementById("phone")
                  .value
                  .trim(),

              address:
                document
                  .getElementById("address")
                  .value
                  .trim(),

              apartment:
                document
                  .getElementById("apartment")
                  .value
                  .trim(),

              suburb:
                document
                  .getElementById("suburb")
                  .value
                  .trim(),

              city:
                document
                  .getElementById("city")
                  .value
                  .trim(),

              province:
                document
                  .getElementById("province")
                  .value
                  .trim(),

              postalCode:
                document
                  .getElementById("postalCode")
                  .value
                  .trim()

            };


            // ------------------------------------------------
            // CALCULATE TOTAL
            // ------------------------------------------------

            const totalAmount =
              Number(
                (
                  subtotal +
                  shippingFee
                ).toFixed(2)
              );


            if (
              !totalAmount ||
              totalAmount <= 0
            ) {

              throw new Error(
                "Your order total could not be calculated."
              );

            }


            // ------------------------------------------------
            // CREATE ORDER ID
            // ------------------------------------------------

            const paymentId =
              "SINATRA-" +
              Date.now();


            // ------------------------------------------------
            // CREATE ORDER SUMMARY
            // ------------------------------------------------

            const cartSummaryText =
              cart
                .map(
                  (item) => {

                    const quantity =
                      item.quantity || 1;

                    const itemTotal =
                      (
                        Number(item.price) *
                        quantity
                      ).toFixed(2);

                    return (
                      `• ${item.name} ` +
                      `(${item.color || "Standard"}, ` +
                      `${item.size || "One Size"}) ` +
                      `x${quantity} - ` +
                      `R${itemTotal}`
                    );

                  }
                )
                .join("\n");


            // ------------------------------------------------
            // SAVE ORDER LOCALLY
            //
            // This is useful for the success page.
            // The order is NOT considered paid until
            // Yoco confirms payment.
            // ------------------------------------------------

            const orderDetails = {

              paymentId,

              fullName:
                customer.fullName,

              email:
                customer.email,

              phone:
                customer.phone,

              address:
                customer.address,

              apartment:
                customer.apartment ||
                "N/A",

              suburb:
                customer.suburb,

              city:
                customer.city,

              province:
                customer.province,

              postalCode:
                customer.postalCode,

              orderItems:
                cartSummaryText,

              subtotal:
                `R${subtotal.toFixed(2)}`,

              shippingFee:
                shippingFee === 0
                  ? "FREE"
                  : `R${shippingFee.toFixed(2)}`,

              totalAmount:
                `R${totalAmount.toFixed(2)}`,

              paymentMethod:
                "Yoco",

              status:
                "pending"

            };


            localStorage.setItem(
              "pendingSinatraOrder",
              JSON.stringify(
                orderDetails
              )
            );


            // ------------------------------------------------
            // SEND ORDER TO SECURE BACKEND
            // ------------------------------------------------
            //
            // IMPORTANT:
            //
            // DO NOT put your Yoco secret key here.
            //
            // The backend will use the secret key.
            //
            // ------------------------------------------------

            const response =
              await fetch(
                "/api/create-yoco-checkout",
                {

                  method: "POST",

                  headers: {

                    "Content-Type":
                      "application/json"

                  },

                  body:
                    JSON.stringify({

                      paymentId,

                      customer,

                      cart,

                      subtotal,

                      shippingFee,

                      totalAmount

                    })

                }
              );


            // ------------------------------------------------
            // READ BACKEND RESPONSE
            // ------------------------------------------------

            let data;

            try {

              data =
                await response.json();

            } catch {

              throw new Error(
                "The payment server returned an invalid response."
              );

            }


            // ------------------------------------------------
            // HANDLE BACKEND ERROR
            // ------------------------------------------------

            if (!response.ok) {

              throw new Error(
                data.message ||
                "Unable to create your Yoco payment."
              );

            }


            // ------------------------------------------------
            // YOCO REDIRECT
            // ------------------------------------------------

            if (
              !data.redirectUrl
            ) {

              throw new Error(
                "Yoco did not provide a payment page."
              );

            }


            if (submitBtn) {

              submitBtn.innerText =
                "REDIRECTING TO YOCO...";

            }


            // Send customer to Yoco
            window.location.href =
              data.redirectUrl;


          } catch (error) {


            console.error(
              "Yoco checkout error:",
              error
            );


            if (paymentError) {

              paymentError.textContent =
                error.message ||
                "Something went wrong. Please try again.";

              paymentError.style.display =
                "block";

            }


            if (submitBtn) {

              submitBtn.disabled =
                false;

              submitBtn.innerText =
                "PROCEED TO PAYMENT";

            }

          }

        }
      );

    }

  }
);