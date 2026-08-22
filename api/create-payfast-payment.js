const crypto =
  require("crypto");

const MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const MERCHANT_KEY =
  process.env.PAYFAST_MERCHANT_KEY;

const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "";

const STORE_ORIGIN =
  "https://sinatraheadwear.com";

function encodeValue(value) {
  return encodeURIComponent(
    String(value).trim()
  )
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function generateSignature(data) {
  const parameterString =
    Object.entries(data)
      .filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
      .map(
        ([key, value]) =>
          `${key}=${encodeValue(value)}`
      )
      .join("&");

  const signedString =
    PASSPHRASE
      ? (
          parameterString +
          "&passphrase=" +
          encodeValue(
            PASSPHRASE
          )
        )
      : parameterString;

  return crypto
    .createHash("md5")
    .update(signedString)
    .digest("hex");
}

module.exports =
  async function handler(
    req,
    res
  ) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      STORE_ORIGIN
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    if (
      req.method ===
      "OPTIONS"
    ) {
      return res
        .status(204)
        .end();
    }

    if (
      req.method !==
      "POST"
    ) {
      return res
        .status(405)
        .json({
          success: false,
          error:
            "Method Not Allowed"
        });
    }

    try {
      if (
        !MERCHANT_ID ||
        !MERCHANT_KEY
      ) {
        return res
          .status(500)
          .json({
            success: false,
            error:
              "PayFast credentials are not configured."
          });
      }

      const {
        paymentId,
        amount,
        firstName,
        lastName,
        email,
        phone,
        itemName,
        itemDescription,
        custom1,
        custom2,
        custom3,
        custom4,
        custom5
      } = req.body || {};

      const numericAmount =
        Number(amount);

      if (
        !paymentId ||
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount < 5 ||
        !itemName
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Invalid payment information."
          });
      }

      const data = {
        merchant_id:
          MERCHANT_ID,

        merchant_key:
          MERCHANT_KEY,

        return_url:
          "https://sinatraheadwear.com/success.html",

        cancel_url:
          "https://sinatraheadwear.com/checkout.html",

        notify_url:
          "https://sinatra-headwear.vercel.app/api/payfast-itn",

        name_first:
          String(
            firstName || ""
          ).substring(0, 100),

        name_last:
          String(
            lastName || ""
          ).substring(0, 100),

        email_address:
          String(
            email || ""
          ).substring(0, 100),

        cell_number:
          String(
            phone || ""
          ).substring(0, 100),

        m_payment_id:
          String(
            paymentId
          ).substring(0, 100),

        amount:
          numericAmount.toFixed(2),

        item_name:
          String(
            itemName
          ).substring(0, 100),

        item_description:
          String(
            itemDescription || ""
          ).substring(0, 255),

        custom_str1:
          String(
            custom1 || ""
          ).substring(0, 255),

        custom_str2:
          String(
            custom2 || ""
          ).substring(0, 255),

        custom_str3:
          String(
            custom3 || ""
          ).substring(0, 255),

        custom_str4:
          String(
            custom4 || ""
          ).substring(0, 255),

        custom_str5:
          String(
            custom5 || ""
          ).substring(0, 255),

        email_confirmation:
          "1",

        confirmation_address:
          "sinatraheadwear@gmail.com"
      };

      const signature =
        generateSignature(
          data
        );

      return res
        .status(200)
        .json({
          success: true,

          processUrl:
            "https://www.payfast.co.za/eng/process",

          fields: {
            ...data,
            signature
          }
        });

    } catch (error) {
      console.error(
        "Create PayFast payment error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            "Could not create payment."
        });
    }
  };