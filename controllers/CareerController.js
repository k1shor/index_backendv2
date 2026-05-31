const Career = require("../models/CareerModel");

const toDateOrUndefined = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizePayload = (body) => ({
  career_title: body.career_title,
  vacancyNumber: body.vacancyNumber,
  offered_salary: body.offered_salary,
  job_description: body.job_description,
  qualification: body.qualification,
  posted_date: toDateOrUndefined(body.posted_date),
  deadline: toDateOrUndefined(body.deadline),
  location: body.location,
  type: body.type,
  isActive:
    body.isActive === undefined
      ? undefined
      : body.isActive === true || body.isActive === "true",
});

exports.createCareer = async (req, res) => {
  try {
    const career = await Career.create(normalizePayload(req.body));
    return res.status(201).json(career);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getCareers = async (req, res) => {
  try {
    const includeDisabled = req.query.includeDisabled === "true";
    const filter = includeDisabled ? {} : { isActive: { $ne: false } };
    const careers = await Career.find(filter).sort({ createdAt: -1 });
    return res.json(careers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAdminCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    return res.json(careers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ error: "Career not found" });
    return res.json(career);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateCareer = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const career = await Career.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!career) return res.status(404).json({ error: "Career not found" });
    return res.json(career);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) return res.status(404).json({ error: "Career not found" });
    return res.json({ message: "Career deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
