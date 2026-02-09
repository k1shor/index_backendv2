const Blog = require("../models/BlogModel");
const cloudinary = require("../config/cloudinary");

// -----------------------------
// CREATE BLOG (CLOUDINARY)
// -----------------------------
exports.createBlog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const blog = await Blog.create({
      ...req.body,
      image: req.file.path,      // Cloudinary URL
      image_id: req.file.filename, // Cloudinary public_id
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------
// GET ALL BLOGS
// -----------------------------
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      total: blogs.length,
      data: blogs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------
// GET BLOG BY SLUG
// -----------------------------
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------
// GET BLOG BY ID
// -----------------------------
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------
// UPDATE BLOG (DELETE OLD IMAGE)
// -----------------------------
exports.updateBlog = async (req, res) => {
  try {
    const existing = await Blog.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const updatedData = { ...req.body };

    if (req.file) {
      if (existing.image_id) {
        await cloudinary.uploader.destroy(existing.image_id);
      }

      updatedData.image = req.file.path;
      updatedData.image_id = req.file.filename;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------
// DELETE BLOG (DELETE CLOUDINARY IMAGE)
// -----------------------------
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (blog.image_id) {
      await cloudinary.uploader.destroy(blog.image_id);
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
