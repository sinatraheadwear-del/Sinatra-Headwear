const crypto =
  require("crypto");

const MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE ||
  "";

function readBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      req.on(
        "data",
        chunk => {

          body +=
            chunk.toString();
        }
      );

      req.on(
        "end",
        () =>
          resolve(body)
      );

      req.on(
        "error",
        reject
      );
    }
  );
}

function parseForm(body) {

  const params =
    new URLSearchParams(
      body
    );

  const data = {};

  for (
    const [key, value]
    of params.entries()
  ) {

    data[key] =
      value;
  }

  return data;
}

function encodeValue(value) {

  return encodeURIComponent(
    String(value).trim()
  ).replace(
    /%20/g,
    "+"
  );
}

function generateSignature(
  data
) {

  const parts = [];

  for (
    const [key, value]
    of Object.entries(data)
  ) {

    if (
      key === "signature"
    ) {
      continue;
    }

    if (
      value === ""
    ) {
      continue;
    }

    parts.push(
      `${key}=${encodeValue(
        value
      )}`
    );
  }

  if (PASSPHRASE) {

    parts.push(
      `passphrase=${encodeValue(
        PASSPHRASE
      )}`
    );
  }

  return crypto
    .createHash("md5")
    .update(
      parts.join("&")
    )
    .digest("hex");
}

async function validatePayFast(
  data
) {

  const params =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(data)
  ) {

    params.append(
      key,
      value
    );
  }

  const response =
    await fetch(
      "https://www.payfast.co.za/eng/query/validate",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body:
          params.toString()
      }
    );

  const result =
    await response.text();

  return (
    result.trim() ===
    "VALID"
  );
}

module.exports =
  async function handler(
    req,
    res
  ) {

    if (
      req.method !==
      "POST"
    ) {

      return res
        .status(405)
        .send(
          "Method Not Allowed"
        );
    }

    try {

      const rawBody =
        await readBody(
          req
        );

      if (!rawBody) {

        return res
          .status(400)
          .send(
            "Empty request"
          );
      }

      const data =
        parseForm(
          rawBody
        );

      console.log(
        "LIVE PAYFAST ITN:",
        {
          order:
            data.m_payment_id,

          payment:
            data.pf_payment_id,

          status:
            data.payment_status,

          amount:
            data.amount_gross,

          item:
            data.item_name
        }
      );

      // Merchant check

      if (
        MERCHANT_ID &&
        String(
          data.merchant_id
        ) !==
          String(
            MERCHANT_ID
          )
      ) {

        console.error(
          "Invalid merchant ID"
        );

        return res
          .status(400)
          .send(
            "Invalid Merchant ID"
          );
      }

      // Signature check

      const expectedSignature =
        generateSignature(
          data
        );

      if (
        data.signature !==
        expectedSignature
      ) {

        console.error(
          "Invalid signature"
        );

        return res
          .status(400)
          .send(
            "Invalid Signature"
          );
      }

      // Confirm with PayFast

      const valid =
        await validatePayFast(
          data
        );

      if (!valid) {

        console.error(
          "PayFast validation failed"
        );

        return res
          .status(400)
          .send(
            "Validation Failed"
          );
      }

      if (
        data.payment_status !==
        "COMPLETE"
      ) {

        console.log(
          "Payment not complete:",
          data.payment_status
        );

        return res
          .status(200)
          .send(
            "Payment Not Complete"
          );
      }

      const amount =
        Number(
          data.amount_gross
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {

        return res
          .status(400)
          .send(
            "Invalid Amount"
          );
      }

      // FULL ORDER DETAILS
      // are now available here.

      console.log(
        "========================"
      );

      console.log(
        "SINATRA ORDER PAID"
      );

      console.log(
        "Order:",
        data.m_payment_id
      );

      console.log(
        "PayFast:",
        data.pf_payment_id
      );

      console.log(
        "Customer:",
        data.name_first
      );

      console.log(
        "Email:",
        data.email_address
      );

      console.log(
        "Phone:",
        data.custom_str1
      );

      console.log(
        "Address:",
        data.custom_str2
      );

      console.log(
        "Area:",
        data.custom_str3
      );

      console.log(
        "Province:",
        data.custom_str4
      );

      console.log(
        "Order totals:",
        data.custom_str5
      );

      console.log(
        "Products:",
        data.item_description
      );

      console.log(
        "Amount paid:",
        data.amount_gross
      );

      console.log(
        "========================"
      );

      return res
        .status(200)
        .send("OK");

    } catch (error) {

      console.error(
        "PayFast ITN error:",
        error
      );

      return res
        .status(500)
        .send(
          "Server Error"
        );
    }
  };