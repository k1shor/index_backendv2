// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");

// const destinationDir = path.join(process.cwd(), "public", "uploads");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     if (!fs.existsSync(destinationDir)) {
//       fs.mkdirSync(destinationDir, { recursive: true });
//     }
//     cb(null, destinationDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const base = path
//       .basename(file.originalname, ext)
//       .toLowerCase()
//       .replace(/[^a-z0-9-_]/g, "-")
//       .replace(/-+/g, "-")
//       .replace(/^-|-$/g, "");

//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${file.fieldname}-${base}-${uniqueSuffix}${ext}`);
//   },
// });

// const allowedExt = new Set([".webp", ".jpeg", ".jpg", ".png", ".gif", ".avif", ".jfif"]);
// const allowedMime = new Set([
//   "image/webp",
//   "image/jpeg",
//   "image/png",
//   "image/gif",
//   "image/avif",
// ]);

// const imageFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();
//   const mime = (file.mimetype || "").toLowerCase();

//   if (!allowedExt.has(ext) || !allowedMime.has(mime)) {
//     return cb(new Error("Invalid image file"), false);
//   }

//   cb(null, true);
// };

// const upload = multer({
//   storage,
//   fileFilter: imageFilter,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// module.exports = upload;
