const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const upload = require("../middleware/upload");
const { cloudinary } = require("../middleware/upload");

// ─────────────────────────────────────────────
// GET /products  →  all products
// ─────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (err) {
    console.error("Get products error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /products/:id  →  single product
// ─────────────────────────────────────────────
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  } catch (err) {
    console.error("Get product error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /products  →  add product + upload image to Cloudinary
// ─────────────────────────────────────────────
router.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { productId, name, price, discountPrice, brand, category, description, gender, shape } = req.body;

    if (!productId || !name || !price) {
      return res.status(400).json({ message: "Product ID, name and price are required" });
    }

    const existing = await Product.findOne({ productId });
    if (existing) {
      return res.status(409).json({ message: "Product ID already exists" });
    }

    // req.file.path  → full Cloudinary HTTPS URL
    // req.file.filename → Cloudinary public_id
    const imageUrl      = req.file ? req.file.path     : "";
    const imagePublicId = req.file ? req.file.filename  : "";

    const product = await Product.create({
      productId,
      name,
      price:         Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      brand,
      category,
      description,
      gender:  gender  || "",
      shape:   shape   || "",
      image:         imageUrl,
      imagePublicId: imagePublicId,
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("Add product error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { productId, name, price, discountPrice, brand, category, description, gender, shape } = req.body;

 
 
    if (req.file) {
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      product.image         = req.file.path;
      product.imagePublicId = req.file.filename;
    }

    if (productId    !== undefined) product.productId    = productId;
    if (name         !== undefined) product.name         = name;
    if (price        !== undefined) product.price        = Number(price);
    if (discountPrice!== undefined) product.discountPrice= Number(discountPrice);
    if (brand        !== undefined) product.brand        = brand;
    if (category     !== undefined) product.category     = category;
    if (description  !== undefined) product.description  = description;
    if (gender       !== undefined) product.gender       = gender;
    if (shape        !== undefined) product.shape        = shape;

    const updated = await product.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update product error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /products/:id  →  delete product + remove image from Cloudinary
// ─────────────────────────────────────────────
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete image from Cloudinary
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await product.deleteOne();
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
