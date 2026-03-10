const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
<<<<<<< HEAD
const cloudinary = require("cloudinary").v2;
=======
const cloudinary = require("cloudinary").v2;  // v2 API works in cloudinary@1.x too
>>>>>>> 9d8cb995ad7692adb445986c9b9533d48c0e99fe

// ── Configure Cloudinary ──────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

<<<<<<< HEAD
// ── Cloudinary Storage (replaces local disk storage) ─────────
// Images are uploaded directly to Cloudinary.
// The returned URL (stored in req.file.path) is a full https:// URL.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eyecore/products",       // folder inside your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, crop: "limit" }], // auto-resize to max 800px
=======
// ── Cloudinary Storage ────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eyecore/products",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, crop: "limit" }],
>>>>>>> 9d8cb995ad7692adb445986c9b9533d48c0e99fe
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
<<<<<<< HEAD
  const ext = allowed.test(file.mimetype);
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
=======
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
>>>>>>> 9d8cb995ad7692adb445986c9b9533d48c0e99fe
  }
};

const upload = multer({
  storage,
  fileFilter,
<<<<<<< HEAD
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;
module.exports.cloudinary = cloudinary; // export for delete operations
=======
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
module.exports.cloudinary = cloudinary;
>>>>>>> 9d8cb995ad7692adb445986c9b9533d48c0e99fe
