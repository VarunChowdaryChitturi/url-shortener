const express = require("express");
const Url = require("../models/Url");
const generateCode = require("../utils/generateCode");
const authMiddleware = require("../middleware/authMiddleware");
const {
  shortenLimiter,
} = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post(
  "/shorten",
  authMiddleware,
  shortenLimiter,
  async (req, res) => {
    try {
      const { originalUrl, customCode, expiresAt } = req.body;

      // Check URL
      if (!originalUrl) {
        return res.status(400).json({
          message: "URL is required",
        });
      }

      // Validate URL
      try {
        const parsedUrl = new URL(originalUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          return res.status(400).json({
            message: "Only HTTP and HTTPS URLs are allowed",
          });
        }
      } catch {
        return res.status(400).json({
          message: "Invalid URL",
        });
      }

      // Validate custom alias
      if (customCode) {
        const validCode = /^[a-zA-Z0-9_-]+$/.test(customCode);

        if (!validCode) {
          return res.status(400).json({
            message:
              "Custom alias can contain only letters, numbers, hyphens and underscores",
          });
        }
      }

      // Validate expiration date
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);

        if (
          isNaN(expiryDate.getTime()) ||
          expiryDate <= new Date()
        ) {
          return res.status(400).json({
            message: "Expiration date must be a valid future date",
          });
        }
      }

      let shortCode;

      // Custom alias
      if (customCode) {
        const existingUrl = await Url.findOne({
          shortCode: customCode,
        });

        if (existingUrl) {
          return res.status(409).json({
            message: "Custom alias already exists",
          });
        }

        shortCode = customCode;
      }

      // Generate random short code
      else {
        while (true) {
          shortCode = generateCode();

          const existingUrl = await Url.findOne({
            shortCode,
          });

          if (!existingUrl) {
            break;
          }
        }
      }

      // Save URL
      const url = await Url.create({
        originalUrl,
        shortCode,
        expiresAt: expiresAt || null,
        user: req.userId,
      });

      res.status(201).json({
        shortUrl: `http://localhost:5000/${shortCode}`,
        originalUrl: url.originalUrl,
      });
    } catch (error) {
      console.error(error);

      // MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Short code already exists",
        });
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

router.get(
  "/:shortCode",
  authMiddleware,
  async (req, res) => {
    try {
      const { shortCode } = req.params;

      const url = await Url.findOne({
        shortCode,
        user: req.userId,
      });

      if (!url) {
        return res.status(404).json({
          message: "Short URL not found",
        });
      }

      res.json({
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;