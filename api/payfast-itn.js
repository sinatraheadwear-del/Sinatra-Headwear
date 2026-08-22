const crypto =
  require("crypto");

const MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID;

const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "";

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
    String(value)
  )
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function createItnParameterString(
  data
) {
  let output = "";

  for (
    const [key, value]
    of Object.entries(data)
  ) {
    if (
      key ===
      "signature"
    ) {
      break;
    }

    if (
      value !== ""
    ) {
      output +=
        `${key}=` +
        `${encodeValue(value)}&`;
    }
  }

  return output.slice(
    0,
    -1
  );
}

function checkSignature(data) {
  if (
    !data.signature
  ) {
    return false;
  }

  let parameterString =
    createItnParameterString(
      data
    );

  if (PASSPHRASE) {
    parameterString +=
      "&passphrase=" +
      encodeValue(
        PASSPHRASE
      );
  }

  const expectedSignature =
    crypto
      .createHash("md5")
      .update(
        parameterString
      )
      .digest("hex");

  return (
    expectedSignature ===
    data.signature
  );
}

async function validateWithPayFast(
  rawBody
) {
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
          rawBody
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
            "Empty Request"
          );
      }

      const data =
        parseForm(
          rawBody
        );

      console.log(
        "LIVE PAYFAST ITN RECEIVED:",
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

      if (
        String(
          data.merchant_id ||
          ""
        ) !==
        String(
          MERCHANT_ID ||
          ""
        )
      ) {
        console.error(
          "Invalid Merchant ID"
        );

        return res
          .status(400)
          .send(
            "Invalid Merchant ID"
          );
      }

      if (
        !checkSignature(
          data
        )
      ) {
        console.error(
          "Invalid PayFast Signature"
        );

        return res
          .status(400)
          .send(
            "Invalid Signature"
          );
      }

      const valid =
        await validateWithPayFast(
          rawBody
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
            "OK"
          );
      }

      const amountGross =
        Number(
          data.amount_gross
        );

      if (
        !Number.isFinite(
          amountGross
        ) ||
        amountGross < 5
      ) {
        console.error(
          "Invalid amount:",
          data.amount_gross
        );

        return res
          .status(400)
          .send(
            "Invalid Amount"
          );
      }

      console.log(
        "=============================="
      );

      console.log(
        "LIVE SINATRA PAYMENT VERIFIED"
      );

      console.log(
        "Order:",
        data.m_payment_id
      );

      console.log(
        "PayFast ID:",
        data.pf_payment_id
      );

      console.log(
        "Customer:",
        data.name_first,
        data.name_last
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
        "Suburb / City:",
        data.custom_str3
      );

      console.log(
        "Province / Postal:",
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
        "Amount Paid:",
        data.amount_gross
      );

      console.log(
        "=============================="
      );

      // Successful PayFast acknowledgement.
      return res
        .status(200)
        .send(
          "OK"
        );

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