const crypto =
  require("crypto");

const MERCHANT_ID =
  "10051196";

const PASSPHRASE =
  process.env
    .PAYFAST_SANDBOX_PASSPHRASE ||
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
  return encodeURIComponent(String(value))
    .replace(/%20/g, "+");
}

function generateSignature(data) {
  let parameterString = "";

  for (const [key, value] of Object.entries(data)) {

    // IMPORTANT:
    // PayFast says stop when the signature field is reached.
    if (key === "signature") {
      break;
    }

    if (value !== "") {
      parameterString +=
        key +
        "=" +
        encodeValue(value) +
        "&";
    }
  }

  // Remove final &
  parameterString =
    parameterString.slice(0, -1);

  if (PASSPHRASE) {
    parameterString +=
      "&passphrase=" +
      encodeValue(PASSPHRASE);
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
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
      "https://sandbox.payfast.co.za/eng/query/validate",
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // PayFast expects an immediate 200 OK acknowledgement
  res.status(200);
  res.setHeader("Content-Type", "text/plain");
  res.write("OK");

  try {

      const rawBody =
        await readBody(
          req
        );

      const data =
        parseForm(
          rawBody
        );

      console.log(
        "SANDBOX ITN:",
        {
          order:
            data.m_payment_id,

          payment:
            data.pf_payment_id,

          status:
            data.payment_status,

          item:
            data.item_name
        }
      );

      if (
        String(
          data.merchant_id
        ) !==
        String(
          MERCHANT_ID
        )
      ) {

        return res
          .status(400)
          .send(
            "Invalid Merchant ID"
          );
      }

      const expectedSignature =
        generateSignature(
          data
        );

      if (
        data.signature !==
        expectedSignature
      ) {

        console.error(
          "Invalid Sandbox Signature"
        );

        return res
          .status(400)
          .send(
            "Invalid Signature"
          );
      }

      const valid =
        await validatePayFast(
          data
        );

      if (!valid) {

        console.error(
          "Sandbox validation failed"
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

        return res
          .status(200)
          .send(
            "Payment Not Complete"
          );
      }

      console.log(
        "========================"
      );

      console.log(
        "SANDBOX ORDER VERIFIED"
      );

      console.log(
        "Order:",
        data.m_payment_id
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
        "Suburb / City:",
        data.custom_str3
      );

      console.log(
        "Province:",
        data.custom_str4
      );

      console.log(
        "Totals:",
        data.custom_str5
      );

      console.log(
        "Products:",
        data.item_description
      );

      console.log(
        "Amount:",
        data.amount_gross
      );

      console.log(
        "========================"
      );

      return res.end();

    } catch (error) {

      console.error(
        "Sandbox ITN error:",
        error
      );

      return res
        .status(500)
        .send(
          "Server Error"
        );
    }
  };