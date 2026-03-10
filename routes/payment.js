const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");

// Initialise Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Used by: checkout.jsx → handleRazorpayPayment()
// Creates a Razorpay order and returns order details
// ─────────────────────────────────────────────
router.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend (safe — it's the public key)
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return res.status(500).json({ message: "Failed to create payment order" });
  }
});

// ─────────────────────────────────────────────
// POST /api/payment/verify-payment
// Used by: checkout.jsx → Razorpay handler callback
// Verifies payment signature to confirm authenticity
// ─────────────────────────────────────────────
router.post("/api/payment/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    // Build expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ success: false, message: "Server error during verification" });
  }
});

module.exports = router;
