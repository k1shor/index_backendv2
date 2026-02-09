const About = require("../models/AboutModel");
const cloudinary = require("../config/cloudinary");

exports.addAboutSection = async (req, res) => {
  try {
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const image = req.file.path || "";
    const image_id = req.file.filename || "";

    const about = await About.create({
      description: description || "",
      image,
      image_id,
    });

    if (!about) {
      return res.status(400).json({ error: "Something went wrong" });
    }

    return res.status(201).json({ success: true, about });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne();
    if (!about) {
      return res.status(404).json({ error: "About section not found" });
    }
    return res.json(about);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      return res.status(404).json({ error: "About section not found" });
    }

    if (req.body.description !== undefined) {
      about.description = req.body.description;
    }

    if (req.file) {
      if (about.image_id) {
        await cloudinary.uploader.destroy(about.image_id);
      }

      about.image = req.file.path || "";
      about.image_id = req.file.filename || "";
    }

    about = await about.save();

    if (!about) {
      return res.status(400).json({ error: "Something went wrong" });
    }

    return res.json(about);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteAbout = async (req, res) => {
  try {
    const data = await About.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({ error: "About section not found" });
    }

    if (data.image_id) {
      await cloudinary.uploader.destroy(data.image_id);
    }

    return res.json({ success: true, message: "About deleted" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
