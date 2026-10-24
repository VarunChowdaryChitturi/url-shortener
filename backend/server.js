require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const {
  redisClient,
  connectRedis,
} = require("./config/redis");

const urlRoutes = require("./routes/urlRoutes");
const Url = require("./models/Url");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);

const PORT = 5000;

connectDB();
connectRedis();

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

app.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    const cachedUrl = await redisClient.get(
      `url:${shortCode}`
    );

    if (cachedUrl) {
      await Url.updateOne(
        { shortCode },
        { $inc: { clicks: 1 } }
      );

      return res.redirect(cachedUrl);
    }

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).send("Short URL not found");
    }

    if (url.expiresAt && url.expiresAt <= new Date()) {
      return res.status(410).send("This short URL has expired");
    }

    const originalUrl = url.originalUrl;

    await Url.updateOne(
      { shortCode },
      { $inc: { clicks: 1 } }
    );

    if (url.expiresAt) {
      const secondsUntilExpiry = Math.floor(
        (url.expiresAt.getTime() - Date.now()) / 1000
      );

      if (secondsUntilExpiry > 0) {
        await redisClient.set(
          `url:${shortCode}`,
          originalUrl,
          {
            EX: Math.min(secondsUntilExpiry, 3600),
          }
        );
      }
    } else {
      await redisClient.set(
        `url:${shortCode}`,
        originalUrl,
        {
          EX: 3600,
        }
      );
    }

    res.redirect(originalUrl);
  } catch (error) {
    console.error(error);

    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});