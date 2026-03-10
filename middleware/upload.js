const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ── Configure Cloudinary ──────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary Storage (replaces local disk storage) ─────────
// Images are uploaded directly to Cloudinary.
// The returned URL (stored in req.file.path) is a full https:// URL.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eyecore/products",       // folder inside your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, crop: "limit" }], // auto-resize to max 800px
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(file.mimetype);
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;
module.exports.cloudinary = cloudinary; // export for delete operations
