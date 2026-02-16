const SiteContent = require("../models/SiteContentModel");

exports.getMissionVision = async (req, res) => {
  try {
    const data = await SiteContent.findOne({ key: "mission-vision" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
