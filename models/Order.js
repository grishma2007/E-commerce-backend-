const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
});

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    customer: { type: customerSchema, required: true },

    // shippingAddress mirrors customer fields — used in Profile/OrderDetails.jsx
    shippingAddress: {
      fullName: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, "Order must have at least one item"],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // cod | razorpay
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "card"],
      default: "cod",
    },

    // Razorpay payment details
    razorpayPayment: {
      paymentId: { type: String, default: "" },
      orderId: { type: String, default: "" },
      signature: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: [
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Cancelled by Seller",
        "Exchange Requested",
      ],
      default: "Processing",
    },

    // Reference to registered user (null for guest checkout)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

