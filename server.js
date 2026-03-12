require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");

// ─── Route imports ────────────────────────────────────────────
const authRoutes    = require("./routes/auth");      // /register /login /logout /me
const userRoutes    = require("./routes/users");     // /info  /info/:id
const productRoutes = require("./routes/products");  // /products  /products/:id
const orderRoutes   = require("./routes/orders");    // /api/orders + sub-routes
const reviewRoutes  = require("./routes/reviews");   // /reviews/:productId
const paymentRoutes = require("./routes/payment");   // /api/payment/*

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
//  CORS — allow both frontends (customer + admin)
// ─────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,          // e.g. https://eyecore.vercel.app
  "http://localhost:3000",          // local customer frontend
  "http://localhost:3001",          // local admin frontend
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
//  SESSION  (stored in MongoDB Atlas via connect-mongo)
// ─────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret_change_me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7, // 7 days
    }),
    cookie: {
      httpOnly: true,
      // Production (Vercel HTTPS): secure + sameSite=none required for cross-site cookies
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ─────────────────────────────────────────────
//  NOTE: Images are stored on Cloudinary.
//  product.image = full https://res.cloudinary.com/... URL
//  No local /uploads folder needed on Vercel.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────
app.use("/", authRoutes);       // POST /register  POST /login  POST /logout  GET /me
app.use("/", userRoutes);       // GET/PUT/DELETE /info  /info/:id
app.use("/", productRoutes);    // GET/POST/PUT/DELETE /products  /products/:id
app.use("/", orderRoutes);      // /api/orders  and all sub-routes
app.use("/", reviewRoutes);     // GET/POST /reviews  /reviews/:productId
app.use("/", paymentRoutes);    // POST /api/payment/create-order  /api/payment/verify-payment

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
//  START  (Vercel uses the exported app, local uses listen)
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
  });
}

module.exports = app;
