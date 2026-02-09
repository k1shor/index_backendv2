const express = require("express");
const router = express.Router();

// 🔁 switched from fileUpload → cloudinaryUpload
const upload = require("../middleware/cloudinaryUpload")("blogs");

const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getBlogById,
} = require("../controllers/blogController");

router.post("/", upload.single("image"), createBlog);
router.get("/", getAllBlogs);
router.get("/id/:id", getBlogById);
router.get("/:slug", getBlogBySlug);
router.put("/:id", upload.single("image"), updateBlog);
router.delete("/:id", deleteBlog);

module.exports = router;
