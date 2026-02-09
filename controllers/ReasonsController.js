const Reasons = require("../models/IndexITHubWhy");
const cloudinary = require("../config/cloudinary");

// GET
exports.getReasons = async (req, res) => {
  try {
    const reasons = await Reasons.find().sort({ sn: 1, createdAt: -1 });
    return res.status(200).json(reasons);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// CREATE
exports.createReason = async (req, res) => {
  try {
    const { reason, sn } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const reason_image = req.file?.path || "";
    const reason_image_id = req.file?.filename || "";

    const newReason = new Reasons({
      reason,
      reason_image,
      reason_image_id,
      ...(sn !== undefined && sn !== "" ? { sn: Number(sn) } : {}),
    });

    await newReason.save();
    return res.status(201).json(newReason);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE (delete old Cloudinary image on replace)
exports.updateReason = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Reasons.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Reason not found" });
    }

    const updatedData = {};

    if (req.body.reason !== undefined) {
      updatedData.reason = req.body.reason;
    }

    if (req.body.sn !== undefined && req.body.sn !== "") {
      updatedData.sn = Number(req.body.sn);
    }

    if (req.file) {
      if (existing.reason_image_id) {
        await cloudinary.uploader.destroy(existing.reason_image_id);
      }

      updatedData.reason_image = req.file.path;
      updatedData.reason_image_id = req.file.filename;
    }

    const updated = await Reasons.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE (delete Cloudinary image)
exports.deleteReason = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reasons.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Reason not found" });
    }

    if (deleted.reason_image_id) {
      await cloudinary.uploader.destroy(deleted.reason_image_id);
    }

    return res.status(200).json({ message: "Reason deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
