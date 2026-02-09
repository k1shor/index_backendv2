const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

function cloudinaryUpload(folderName) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `indexithub/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

module.exports = cloudinaryUpload;
