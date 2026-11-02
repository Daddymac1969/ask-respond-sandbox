"use strict";
// Deliberately gated preview candidate. Public-anonymous behaviour is NOT implied.
const crypto = require("node:crypto");
const {configuredSecret, issueSession} = require("../shared/sandbox-session");
const HEADERS = {"Content-Type":"application/json","Cache-Control":"no-store"};
const respond = (statusCode, body) => ({statusCode, headers:HEADERS, body:JSON.stringify(body)});
const digest = value => crypto.createHash("sha256").update(value).digest();
exports.handler = async event => {
  if (event.httpMethod === "OPTIONS") return {statusCode:204,headers:HEADERS,body:""};
  if (event.httpMethod !== "POST") return respond(405,{error:"Method not allowed"});
  if (!configuredSecret()) return respond(503,{error:"Sandbox access not configured"});
  const allowed = [];
  for (let n=1; n<=10; n++) {
    const code = process.env["ACCESS_CODE_" + n];
    if (typeof code === "string" && code.trim() && code.length <= 128)
      allowed.push(digest(code.trim().toUpperCase()));
  }
  if (!allowed.length) return respond(503,{error:"Sandbox access not configured"});
  if (typeof event.body !== "string" || event.body.length > 512)
    return respond(400,{error:"Invalid request"});
  let payload;
  try { payload = JSON.parse(event.body); }
  catch (_) {return respond(400,{error:"Invalid request"});}
  const code = payload?.code;
  if (typeof code !== "string" || !code.trim() || code.length > 128)
    return respond(400,{success:false,error:"Invalid access code"});
  const candidate = digest(code.trim().toUpperCase());
  let valid = false;
  for (const expected of allowed)
    valid = crypto.timingSafeEqual(candidate, expected) || valid;
  if (!valid) return respond(401,{success:false,error:"Invalid access code"});
  const session = issueSession();
  if (!session) return respond(503,{error:"Sandbox access not configured"});
  return respond(200,{success:true,...session});
};
