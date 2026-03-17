// Netlify serverless function for password verification
// Passwords are stored as environment variables - never exposed to client

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const validPasswords = [
    process.env.ACCESS_CODE_1,   // RESPOND-DEMO
    process.env.ACCESS_CODE_2,   // DSLDEMO26
    process.env.ACCESS_CODE_3,   // TRYRSPND
    process.env.ACCESS_CODE_4,   // PROTEST26
    process.env.ACCESS_CODE_5,   // SAFEGUARD1
    process.env.ACCESS_CODE_6,   // KCSIE2025
    process.env.ACCESS_CODE_7,   // ACTMODEL
    process.env.ACCESS_CODE_8,   // THRESHOLD
    process.env.ACCESS_CODE_9,   // DUTYOFCARE
    process.env.ACCESS_CODE_10,  // PILOTDSL
  ].filter(Boolean);

  if (validPasswords.length === 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Access password not configured" }),
    };
  }

  try {
    const { password } = JSON.parse(event.body || "{}");

    if (!password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Password required" }),
      };
    }

    const isValid = validPasswords.includes(password);

    return {
      statusCode: isValid ? 200 : 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isValid
          ? { success: true }
          : { success: false, error: "Invalid password" }
      ),
    };
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Invalid request" }),
    };
  }
};

