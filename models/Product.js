const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    brand:       { type: String, trim: true, default: "" },
    category:    { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex", ""],
      default: "",
    },
    shape: { type: String, default: "" },

    // Cloudinary full HTTPS URL  e.g. https://res.cloudinary.com/...
    image: { type: String, default: "" },

    // Cloudinary public_id — needed to delete the image from Cloudinary
    imagePublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
