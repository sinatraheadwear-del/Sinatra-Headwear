// api/payfast-itn-sandbox.js

const crypto = require("crypto");

const MERCHANT_ID = "10000100";
const PASSPHRASE = "jt7NOE43FZPn";

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
        key +
        "=" +
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

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {

    const rawBody = await readBody(req);

    const data = parseForm(rawBody);

    console.log("SANDBOX ITN RECEIVED:", data);

    // Check Merchant ID
    if (data.merchant_id !== MERCHANT_ID) {
      return res.status(400).send("Invalid Merchant ID");
    }

    // Check signature
    const expectedSignature = generateSignature(data);

    if (data.signature !== expectedSignature) {
      console.error("Invalid signature");

      return res.status(400).send("Invalid Signature");
    }

    // Ask PayFast Sandbox to validate the transaction
    const valid = await validateWithPayFast(data);

    if (!valid) {
      console.error("PayFast Sandbox validation failed");

      return res.status(400).send("Validation Failed");
    }

    // Check payment status
    if (data.payment_status !== "COMPLETE") {
      console.log(
        "Payment status:",
        data.payment_status
      );

      return res.status(200).send("Payment Not Complete");
    }

    // SUCCESS
    console.log("==============================");
    console.log("SANDBOX PAYMENT VERIFIED");
    console.log("Order:", data.m_payment_id);
    console.log("PayFast ID:", data.pf_payment_id);
    console.log("Amount:", data.amount_gross);
    console.log("Email:", data.email_address);
    console.log("==============================");

    return res.status(200).send("OK");

  } catch (error) {

    console.error(
      "Sandbox ITN error:",
      error
    );

    return res.status(500).send("Server Error");
  }
};