const ApplyCareer = require("../models/ApplyCareerModel");

exports.applyCareer = async (req, res) => {
  try {
    const {
      career,
      first_name,
      last_name,
      email,
      phone_number,
      qualification,
      experience,
      reference,
    } = req.body;

    if (!first_name || !last_name || !email || !phone_number || !qualification || !experience) {
      return res.status(400).json({ error: "Please fill all required fields." });
    }

    const application = await ApplyCareer.create({
      career: career || null,
      first_name,
      last_name,
      email,
      phone_number,
      qualification,
      experience,
      reference,
    });

    return res.status(201).json({
      message: "Application submitted successfully.",
      data: application,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getAppliedCareers = async (req, res) => {
  try {
    const applications = await ApplyCareer.find()
      .populate("career", "career_title vacancyNumber deadline location type")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAppliedCareersByCareer = async (req, res) => {
  try {
    const applications = await ApplyCareer.find({ career: req.params.id })
      .populate("career", "career_title vacancyNumber deadline location type")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateAppliedCareer = async (req, res) => {
  try {
    const application = await ApplyCareer.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate("career", "career_title vacancyNumber deadline location type");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json(application);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteAppliedCareer = async (req, res) => {
  try {
    const application = await ApplyCareer.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({ message: "Application deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
