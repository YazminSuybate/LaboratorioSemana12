const jwt = require("jsonwebtoken");

REFRESH_SECRET = process.env.JWT_SECRET + "_REFRESH"
REFRESH_EXPIRES = "7d"

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signAccessToken, verifyToken, signRefreshToken, verifyRefreshToken };