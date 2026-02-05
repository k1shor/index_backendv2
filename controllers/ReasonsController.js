const Reasons = require('../models/IndexITHubWhy');

// ✅ Get all reasons
exports.getReasons = async (req, res) => {
  try {
    const reasons = await Reasons.find().sort({ createdAt: -1 });
    res.status(200).json(reasons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new reason (with optional image)
exports.createReason = async (req, res) => {
  try {
    const { reason } = req.body;
    const reason_image = req.file ? `/public/uploads/${req.file.filename}` : null;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const newReason = new Reasons({ reason, reason_image });
    await newReason.save();

    res.status(201).json(newReason);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update a reason (with optional image)
exports.updateReason = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { reason: req.body.reason };

    if (req.file) {
      updatedData.reason_image = `/public/uploads/${req.file.filename}`;
    }

    const updated = await Reasons.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Reason not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a reason
exports.deleteReason = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reasons.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Reason not found" });
    }

    res.status(200).json({ message: "Reason deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
