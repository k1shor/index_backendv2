const Blog = require("../models/BlogModel");
const fs = require("fs");
const path = require("path");


// -----------------------------
// CREATE BLOG (WITH IMAGE UPLOAD)
// -----------------------------
exports.createBlog = async (req, res) => {
    try {
        console.log(req.body)

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required",
            });
        }

        const blog = await Blog.create({
            ...req.body,
            image: req.file.filename,   // store uploaded file name
        });

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: blog,
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



// -----------------------------
// GET ALL BLOGS
// -----------------------------
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: blogs.length,
            data: blogs,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



// -----------------------------
// GET SINGLE BLOG BY SLUG
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

        res.status(200).json({
            success: true,
            data: blog,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// -----------------------------
// GET SINGLE BLOG BY ID
// -----------------------------
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        res.status(200).json({
            success: true,
            data: blog,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



// -----------------------------
// UPDATE BLOG (ID)
// Supports:
//   - updating text fields
//   - updating image (replaces old file)
// -----------------------------
exports.updateBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        // If new image uploaded → delete old image
        if (req.file) {
            const oldImagePath = path.join("public/uploads", blog.image);

            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update blog fields
        const updatedData = {
            ...req.body,
        };

        // If image uploaded, update the field
        if (req.file) {
            updatedData.image = req.file.filename;
        }

        blog = await Blog.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            data: blog,
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



// -----------------------------
// DELETE BLOG (AND IMAGE FILE)
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

        // Delete uploaded image
        const imagePath = path.join("public/uploads", blog.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
