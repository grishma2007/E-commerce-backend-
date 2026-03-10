const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");

// ─────────────────────────────────────────────
// GET /api/orders  →  all orders (admin panel)
// ─────────────────────────────────────────────
router.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/my-orders  →  orders for logged-in customer
// Used by: Profile.jsx
// ─────────────────────────────────────────────
router.get("/api/orders/my-orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Get my-orders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  →  single order detail
// Used by: OrderDetails.jsx (frontend) & admin OrderDetails
// ─────────────────────────────────────────────
router.get("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(order);
  } catch (err) {
    console.error("Get order error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders  →  create new order
// Used by: checkout.jsx  (customer frontend)
// ─────────────────────────────────────────────
router.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      paymentMethod,
      razorpayPayment,
      userId,
    } = req.body;

    if (!customer || !items || items.length === 0 || totalAmount === undefined) {
      return res
        .status(400)
        .json({ message: "customer, items and totalAmount are required" });
    }

    // Normalise cart item prices (frontend stores them as "₹499" strings sometimes)
    const normalizedItems = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price:
        typeof item.price === "number"
          ? item.price
          : parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0,
      image: item.image || "",
      productId: item._id || item.id || undefined,
    }));

    // Build shippingAddress from customer form (used in Profile/OrderDetails)
    const shippingAddress = {
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      address: customer.address || "",
      city: customer.city || "",
      postalCode: customer.postalCode || "",
      phone: customer.phone || "",
    };

    const isPaid = paymentMethod === "razorpay";

    const order = await Order.create({
      customer,
      shippingAddress,
      items: normalizedItems,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
      razorpayPayment: razorpayPayment || {},
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      // Attach to logged-in user if session exists
      userId: req.session?.userId || userId || null,
    });

    return res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  →  update order (admin)
// ─────────────────────────────────────────────
router.put("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const { status, isPaid } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status) order.status = status;
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      order.paidAt = isPaid ? new Date() : undefined;
    }

    const updated = await order.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update order error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/cancel  →  cancel order
// Used by: OrderList.jsx (admin) & Profile.jsx & OrderDetails.jsx (frontend)
// ─────────────────────────────────────────────
router.put("/api/orders/:id/cancel", requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Delivered") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a delivered order" });
    }

    // Admin sets "Cancelled by Seller", customer sets "Cancelled"
    const newStatus = req.body.status || "Cancelled";
    order.status = newStatus;
    const updated = await order.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/update-status  →  generic status update
// Used by: OrderDetails.jsx (frontend) — for Exchange Requested
// ─────────────────────────────────────────────
router.put("/api/orders/:id/update-status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    const updated = await order.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/orders/:id  →  delete order (admin)
// ─────────────────────────────────────────────
router.delete("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

