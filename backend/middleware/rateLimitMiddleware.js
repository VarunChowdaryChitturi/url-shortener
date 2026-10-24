const rateLimit = require("express-rate-limit");

const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  message: {
    message:
      "Too many URL shortening requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  message: {
    message:
      "Too many login attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  shortenLimiter,
  loginLimiter,
};