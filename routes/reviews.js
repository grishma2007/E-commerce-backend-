const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// ─────────────────────────────────────────────
// GET /reviews/:productId  →  get all reviews for a product
// Used by: ProductDetails.jsx
// ─────────────────────────────────────────────
router.get("/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({
      createdAt: -1,
    });

    // Format date for frontend display
    const formatted = reviews.map((r) => ({
      id: r._id,
      user: r.user,
      rating: r.rating,
      text: r.text,
      date: new Date(r.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("Get reviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /reviews  →  submit a new review
// Used by: ProductDetails.jsx (Write a Review modal)
// ─────────────────────────────────────────────
router.post("/reviews", async (req, res) => {
  try {
    const { productId, user, rating, text } = req.body;

    if (!productId || !user || !rating || !text) {
      return res
        .status(400)
        .json({ message: "productId, user, rating and text are required" });
    }

    const review = await Review.create({
      productId,
      user,
      rating: Number(rating),
      text,
      userId: req.session?.userId || null,
    });

    return res.status(201).json({
      id: review._id,
      user: review.user,
      rating: review.rating,
      text: review.text,
      date: new Date(review.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  } catch (err) {
    console.error("Post review error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
