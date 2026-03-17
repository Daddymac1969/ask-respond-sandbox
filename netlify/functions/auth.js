// Netlify serverless function for password verification
const https = require("https");

const GOOGLE_SHEET_URL =
  process.env.GOOGLE_SHEET_URL ||
  process.env.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbysOYqL1QYPovR1ilb4j0oUpXCv_ekh-2YQbezhdYVZw774DAgB3yoRDDZ3rOB0CKiN/exec";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const codeMap = [
    { env: "ACCESS_CODE_1",  value: process.env.ACCESS_CODE_1  },
    { env: "ACCESS_CODE_2",  value: process.env.ACCESS_CODE_2  },
    { env: "ACCESS_CODE_3",  value: process.env.ACCESS_CODE_3  },
    { env: "ACCESS_CODE_4",  value: process.env.ACCESS_CODE_4  },
    { env: "ACCESS_CODE_5",  value: process.env.ACCESS_CODE_5  },
    { env: "ACCESS_CODE_6",  value: process.env.ACCESS_CODE_6  },
    { env: "ACCESS_CODE_7",  value: process.env.ACCESS_CODE_7  },
    { env: "ACCESS_CODE_8",  value: process.env.ACCESS_CODE_8  },
    { env: "ACCESS_CODE_9",  value: process.env.ACCESS_CODE_9  },
    { env: "ACCESS_CODE_10", value: process.env.ACCESS_CODE_10 },
  ].filter(c => c.value);

  if (codeMap.length === 0) {
    return { statusCode: 500, body: JSON.stringify({ error: "Access password not configured" }) };
  }
  try {
    const { password } = JSON.parse(event.body || "{}");
    if (!password) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Password required" }) };
    }
    const matched = codeMap.find(c => c.value === password);
    const isValid = !!matched;
    if (isValid) logLogin(matched.env).catch(() => {});
    return {
      statusCode: isValid ? 200 : 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isValid ? { success: true } : { success: false, error: "Invalid password" })
    };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid request" }) };
  }
};

async function logLogin(codeLabel) {
  try {
    const params = new URLSearchParams({
      question: "[LOGIN] " + codeLabel, response: "", source: "SANDBOX-LOGIN", meta: "", ts: new Date().toISOString()
    });
    return new Promise((resolve) => {
      https.get(GOOGLE_SHEET_URL + "?" + params.toString(), (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) https.get(loc, () => resolve()).on("error", () => resolve());
          else resolve();
        } else resolve();
      }).on("error", () => resolve());
    });
  } catch { }
}
