"use strict";
// Proposed access-code-gated sandbox: server verifies a short-lived, signed bearer.
// Release requires a product-owner decision: the old README described an anonymous demo.
const crypto = require("node:crypto");
const MAX_AGE_MS = 30 * 60 * 1000;

function configuredSecret() {
  const secret = process.env.SANDBOX_SESSION_SECRET;
  return typeof secret === "string" && Buffer.byteLength(secret, "utf8") >= 32 ? secret : null;
}
function signature(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}
function issueSession(now = Date.now()) {
  const secret = configuredSecret();
  if (!secret) return null;
  if (!Number.isSafeInteger(now) || now < 0) return null;
  const expiresAt = now + MAX_AGE_MS;
  const payload = Buffer.from(JSON.stringify({
    v: 1, iat: now, exp: expiresAt, nonce: crypto.randomBytes(16).toString("base64url")
  })).toString("base64url");
  return {token: payload + "." + signature(payload, secret), expiresAt};
}
function verifyToken(token, now = Date.now()) {
  const secret = configuredSecret();
  if (!secret || typeof token !== "string" || token.length > 1024 ||
      !Number.isSafeInteger(now) || now < 0) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return false;
  const [payload, suppliedSignature] = parts;
  const a = Buffer.from(suppliedSignature, "base64url");
  const b = Buffer.from(signature(payload, secret), "base64url");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims && claims.v === 1 &&
      Number.isSafeInteger(claims.iat) && Number.isSafeInteger(claims.exp) &&
      typeof claims.nonce === "string" && claims.nonce.length >= 16 &&
      claims.iat >= 0 && claims.iat <= now &&
      claims.exp > now && claims.exp > claims.iat &&
      claims.exp - claims.iat <= MAX_AGE_MS;
  } catch (_) { return false; }
}
function bearer(headers = {}) {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === "authorization")?.[1];
  if (typeof value !== "string") return null;
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(value.trim());
  return match ? match[1] : null;
}
function verifyRequest(headers, now = Date.now()) {
  return verifyToken(bearer(headers), now);
}
module.exports = {MAX_AGE_MS, configuredSecret, issueSession, verifyToken, bearer, verifyRequest};
