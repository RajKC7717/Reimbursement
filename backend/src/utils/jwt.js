/**
 * JWT Utility
 * Sign and verify access tokens and refresh tokens.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign an access token (short-lived)
 * Payload: { id, email, role, company_id }
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
}

/**
 * Verify an access token
 * @returns decoded payload or throws
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Sign a refresh token (long-lived)
 * Payload: { id }
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
}

/**
 * Verify a refresh token
 * @returns decoded payload or throws
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
