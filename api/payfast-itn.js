// api/payfast-itn.js

const crypto = require("crypto");

// Your PayFast Merchant ID
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;

// Your PayFast Security Passphrase
// Keep this in Vercel Environment Variables.
// DO NOT put it directly in this file.
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";

// PayFast's current server IP ranges
const PAYFAST_CIDRS = [
  ["197.97.145.144", 28],
  ["41.74.179.192", 27],
  ["102.216.36.0", 28],
  ["102.216.36.128", 28],
  ["144.126.193.139", 32]
];

// ----------------------------------------------------
// Read the raw request body
// ----------------------------------------------------

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

// ----------------------------------------------------
// Parse application/x-www-form-urlencoded data
// ----------------------------------------------------

function parseForm(body) {
  const params = new URLSearchParams(body);
  const data = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}

// ----------------------------------------------------
// Generate PayFast ITN signature
// ----------------------------------------------------

function generateSignature(data) {
  let parameterString = "";

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") continue;

    if (value !== "") {
      parameterString +=
        key +
        "=" +
        encodeURIComponent(String(value).trim()) +
        "&";
    }
  }

  parameterString = parameterString.slice(0, -1);

  if (PASSPHRASE) {
    parameterString +=
      "&passphrase=" +
      encodeURIComponent(PASSPHRASE.trim());
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

// ----------------------------------------------------
// Check signature
// ----------------------------------------------------

function checkSignature(data) {
  if (!data.signature) {
    return false;
  }

  const calculatedSignature = generateSignature(data);

  return calculatedSignature === data.signature;
}

// ----------------------------------------------------
// Convert IPv4 address to number
// ----------------------------------------------------

function ipToNumber(ip) {
  const parts = ip.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      part => !Number.isInteger(part) || part < 0 || part > 255
    )
  ) {
    return null;
  }

  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    parts[3]
  );
}

// ----------------------------------------------------
// Check whether IP belongs to PayFast network
// ----------------------------------------------------

function ipMatchesCIDR(ip, network, prefix) {
  const ipNumber = ipToNumber(ip);
  const networkNumber = ipToNumber(network);

  if (ipNumber === null || networkNumber === null) {
    return false;
  }

  const mask =
    prefix === 0
      ? 0
      : (0xffffffff << (32 - prefix)) >>> 0;

  return (ipNumber & mask) === (networkNumber & mask);
}

function isPayFastIP(ip) {
  return PAYFAST_CIDRS.some(([network, prefix]) =>
    ipMatchesCIDR(ip, network, prefix)
  );
}

// ----------------------------------------------------
// Get visitor/server IP
// ----------------------------------------------------

function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    ""
  ).replace("::ffff:", "");
}

// ----------------------------------------------------
// Confirm notification with PayFast
// ----------------------------------------------------

async function confirmWithPayFast(data) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }

  const response = await fetch(
    "https://www.payfast.co.za/eng/query/validate",
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

// ----------------------------------------------------
// Vercel API handler
// ----------------------------------------------------

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Read PayFast notification
    const rawBody = await readBody(req);

    if (!rawBody) {
      return res.status(400).send("Empty request");
    }

    const data = parseForm(rawBody);

    console.log("PayFast ITN received:", {
      m_payment_id: data.m_payment_id,
      pf_payment_id: data.pf_payment_id,
      payment_status: data.payment_status,
      amount_gross: data.amount_gross
    });

    // ------------------------------------------------
    // CHECK 1: Merchant ID
    // ------------------------------------------------

    if (
      MERCHANT_ID &&
      String(data.merchant_id) !== String(MERCHANT_ID)
    ) {
      console.error("Invalid merchant ID");
      return res.status(400).send("Invalid merchant ID");
    }

    // ------------------------------------------------
    // CHECK 2: PayFast IP
    // ------------------------------------------------

    const clientIP = getClientIP(req);

    if (clientIP && !isPayFastIP(clientIP)) {
      console.error("Invalid PayFast IP:", clientIP);

      return res.status(403).send("Invalid source");
    }

    // ------------------------------------------------
    // CHECK 3: Signature
    // ------------------------------------------------

    if (!checkSignature(data)) {
      console.error("Invalid PayFast signature");

      return res.status(400).send("Invalid signature");
    }

    // ------------------------------------------------
    // CHECK 4: Payment status
    // ------------------------------------------------

    if (data.payment_status !== "COMPLETE") {
      console.log(
        "Payment not complete:",
        data.payment_status
      );

      return res.status(200).send("Payment not complete");
    }

    // ------------------------------------------------
    // CHECK 5: Basic payment amount validation
    // ------------------------------------------------

    const amount = Number(data.amount_gross);

    if (!Number.isFinite(amount) || amount < 5) {
      console.error("Invalid payment amount:", amount);

      return res.status(400).send("Invalid amount");
    }

    // ------------------------------------------------
    // CHECK 6: Ask PayFast to confirm the transaction
    // ------------------------------------------------

    const validWithPayFast =
      await confirmWithPayFast(data);

    if (!validWithPayFast) {
      console.error(
        "PayFast server confirmation failed"
      );

      return res.status(400).send("Payment not validated");
    }

    // ------------------------------------------------
    // PAYMENT VERIFIED
    // ------------------------------------------------

    console.log("================================");
    console.log("PAYMENT VERIFIED");
    console.log("Order:", data.m_payment_id);
    console.log("PayFast ID:", data.pf_payment_id);
    console.log("Customer:", data.email_address);
    console.log("Amount:", data.amount_gross);
    console.log("================================");

    /*
      IMPORTANT:

      This is where your website can now perform
      post-payment actions.

      Examples:

      - Save the order to a database
      - Send an order confirmation email
      - Send your dispatch notification
      - Mark the order as PAID
      - Reduce product stock
    */

    return res.status(200).send("OK");

  } catch (error) {
    console.error(
      "PayFast ITN error:",
      error
    );

    return res.status(500).send("Server error");
  }
};