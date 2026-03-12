// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("cloudinary").v2;  

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key:    process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "eyecore/products",
//     allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
//     transformation: [{ width: 800, crop: "limit" }],
//   },
// });

// const fileFilter = (_req, file, cb) => {
//   const allowed = /jpeg|jpg|png|gif|webp/;
//   if (allowed.test(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed"));
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, 
// });

// module.exports = upload;
// module.exports.cloudinary = cloudinary;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===============================
// ENSURE UPLOADS FOLDER EXISTS
// ===============================
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// STORAGE CONFIG
// ===============================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// ===============================
// FILE FILTER (IMAGES ONLY)
// ===============================
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// ===============================
// MULTER INSTANCE
// ===============================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;