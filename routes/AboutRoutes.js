const express = require("express");
const router = express.Router();

const {
  addAboutSection,
  getAbout,
  updateAbout,
  deleteAbout,
} = require("../controllers/AboutController");

// 🔁 switched from fileUpload → cloudinaryUpload
const upload = require("../middleware/cloudinaryUpload")("about");

// Routes
router.post("/add", upload.single("image-about"), addAboutSection);
router.get("/get", getAbout);
router.put("/update", upload.single("image-about"), updateAbout);
router.delete("/delete/:id", deleteAbout);

module.exports = router;
