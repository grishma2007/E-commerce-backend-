require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

// ─── Route imports ────────────────────────────────────────────
const authRoutes    = require("./routes/auth");
const userRoutes    = require("./routes/users");
const productRoutes = require("./routes/products");
const orderRoutes   = require("./routes/orders");
const reviewRoutes  = require("./routes/reviews");
const paymentRoutes = require("./routes/payment");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
//  MONGODB ATLAS CONNECTION
// ─────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅  MongoDB Atlas connected"))
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

// ─────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─────────────────────────────────────────────
//  BODY PARSERS
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
//  SERVE UPLOADED IMAGES AS STATIC FILES
//  Access via: https://your-backend.com/uploads/filename.jpg
// ─────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─────────────────────────────────────────────
//  SESSION
// ─────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret_change_me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", reviewRoutes);
app.use("/", paymentRoutes);

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Eyecore backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
//  404
// ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`    Auth     →  /register  /login  /logout  /me`);
    console.log(`    Users    →  /info  /info/:id`);
    console.log(`    Products →  /products  /products/:id`);
    console.log(`    Orders   →  /api/orders  /api/orders/my-orders`);
    console.log(`    Reviews  →  /reviews/:productId`);
    console.log(`    Payment  →  /api/payment/create-order  /api/payment/verify-payment`);
    console.log(`    Uploads  →  /uploads/<filename>`);
  });
}

module.exports = app;