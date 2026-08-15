const crypto = require("crypto");

const MERCHANT_ID = "10000100";
const MERCHANT_KEY = "46f0cd694581a";
const PASSPHRASE = "jt7NOE43FZPn";

// PUT YOUR WEB3FORMS ACCESS KEY HERE
const WEB3FORMS_ACCESS_KEY ="0200f736-cd68-4ffa-aadc-55892755d561";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseForm(body) {
  const params = new URLSearchParams(body);
  const data = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}

function generateSignature(data) {
  let parameterString = "";

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") continue;

    if (value !== "") {
      parameterString +=
        key + "=" +
        encodeURIComponent(String(value).trim()) +
        "&";
    }
  }

  parameterString = parameterString.slice(0, -1);

  parameterString +=
    "&passphrase=" +
    encodeURIComponent(PASSPHRASE);

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

async function validateWithPayFast(data) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }

  const response = await fetch(
    "https://sandbox.payfast.co.za/eng/query/validate",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: params.toString()
    }
  );

  const result = await response.text();

  return result.trim() === "VALID";
}

async function sendOrderEmail(data) {

  const orderNumber =
    data.m_payment_id || "Unknown";

  const customerName =
    `${data.name_first || ""} ${data.name_last || ""}`.trim();

  const emailData = {
    access_key: WEB3FORMS_ACCESS_KEY,

    subject:
      `NEW SINATRA HEADWEAR ORDER - ${orderNumber}`,

    from_name:
      "Sinatra Headwear",

    name:
      customerName || "Customer",

    email:
      data.email_address || "",

    message: `
NEW SINATRA HEADWEAR ORDER
==========================

Order Number:
${orderNumber}

PayFast Payment ID:
${data.pf_payment_id || "N/A"}

Payment Status:
${data.payment_status || "N/A"}

Amount Paid:
R${data.amount_gross || "0.00"}

CUSTOMER
--------
Name:
${customerName}

Email:
${data.email_address || "N/A"}

Phone:
${data.cell_number || "N/A"}

ORDER
-----
Item:
${data.item_name || "Sinatra Headwear Order"}

==========================
This order was verified through PayFast Sandbox.
`
  };

  const response = await fetch(
    "https://api.web3forms.com/submit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(emailData)
    }
  );

  const result = await response.json();

  console.log("Web3Forms response:", result);

  return response.ok;
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method Not Allowed");
  }

  try {

    const rawBody = await readBody(req);

    const data = parseForm(rawBody);

    console.log(
      "PAYFAST SANDBOX ITN RECEIVED:",
      data
    );

    // 1. Merchant check
    if (data.merchant_id !== MERCHANT_ID) {
      return res
        .status(400)
        .send("Invalid Merchant ID");
    }

    // 2. Signature check
    const expectedSignature =
      generateSignature(data);

    if (
      data.signature !== expectedSignature
    ) {
      console.error(
        "Invalid PayFast signature"
      );

      return res
        .status(400)
        .send("Invalid Signature");
    }

    // 3. PayFast server validation
    const valid =
      await validateWithPayFast(data);

    if (!valid) {
      console.error(
        "PayFast validation failed"
      );

      return res
        .status(400)
        .send("Validation Failed");
    }

    // 4. Payment status
    if (
      data.payment_status !== "COMPLETE"
    ) {
      console.log(
        "Payment status:",
        data.payment_status
      );

      return res
        .status(200)
        .send("Payment Not Complete");
    }

    // 5. PAYMENT VERIFIED
    console.log(
      "PAYMENT VERIFIED:",
      data.m_payment_id
    );

    // 6. SEND ORDER EMAIL
    const emailSent =
      await sendOrderEmail(data);

    if (!emailSent) {
      console.error(
        "Order email failed"
      );

      // Payment itself is still valid.
      return res
        .status(200)
        .send("Payment Verified - Email Failed");
    }

    console.log(
      "ORDER EMAIL SENT SUCCESSFULLY"
    );

    return res
      .status(200)
      .send("OK");

  } catch (error) {

    console.error(
      "ITN ERROR:",
      error
    );

    return res
      .status(500)
      .send("Server Error");
  }
};