const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

// ─────────────────────────────────────────────
// GET /info  →  fetch all users (Dashboard)
// Protected: must be logged in
// ─────────────────────────────────────────────
router.get("/info", requireAuth, async (req, res) => {
  try {
    // Return all users except their passwords
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// PUT /info/:id  →  update a user (name, email, phone)
// ─────────────────────────────────────────────
router.put("/info/:id", requireAuth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update user error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /info/:id  →  delete a user
// ─────────────────────────────────────────────
router.delete("/info/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return remaining users so frontend can update state
    const remaining = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ message: "User deleted", users: remaining });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
