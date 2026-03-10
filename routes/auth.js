const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ─────────────────────────────────────────────
// POST /register
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Basic presence check (frontend also validates, but always validate server-side)
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, phone, password });

    // Auto-login after register – save session
    req.session.userId = user._id;
    req.session.userName = user.name;

    return res.status(201).json({
      message: "Registration successful",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /login
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Save session
    req.session.userId = user._id;
    req.session.userName = user.name;

    return res.status(200).json({
      message: "Login successful",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /logout
// ─────────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

// ─────────────────────────────────────────────
// GET /me  →  get currently logged-in user info
// Used by: Profile.jsx
// ─────────────────────────────────────────────
router.get("/me", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("Get /me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
