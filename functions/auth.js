// netlify/functions/auth.js
// Sandbox access code verification.
// Checks against ACCESS_CODE_1 … ACCESS_CODE_10 environment variables.
// Set each in Netlify: Site > Environment variables

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Collect all configured access codes
  const validCodes = [];
  for (let i = 1; i <= 10; i++) {
    const code = process.env[`ACCESS_CODE_${i}`];
    if (code && code.trim()) validCodes.push(code.trim().toUpperCase());
  }

  if (validCodes.length === 0) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "No access codes configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const submitted = (body.code || "").trim().toUpperCase();

  if (!submitted) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Access code required" }) };
  }

  const isValid = validCodes.includes(submitted);

  return {
    statusCode: isValid ? 200 : 401,
    headers,
    body: JSON.stringify(
      isValid
        ? { success: true }
        : { success: false, error: "Invalid access code" }
    ),
  };
};
