const Project = require("../models/ProjectModel");
const slugify = require("slugify");

const toBooleanOrUndefined = (value) => {
  if (value === undefined) return undefined;
  return value === true || value === "true";
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasAny = (body, keys) => keys.some((key) => Object.prototype.hasOwnProperty.call(body, key));

const normalizePayload = (body, { partial = false } = {}) => {
  const title = body.title || body.project_title;
  const slug = body.slug || (title ? slugify(title, { lower: true, strict: true }) : undefined);

  const payload = {};
  if (title !== undefined) payload.title = title;
  if (slug !== undefined) payload.slug = slug;
  if (body.category !== undefined) payload.category = body.category || undefined;
  if (body.description !== undefined || body.short_description !== undefined) {
    payload.description = body.description || body.short_description;
  }
  if (hasAny(body, ["technologies", "language", "tools"])) {
    payload.technologies = toArray(body.technologies || body.language || body.tools);
  } else if (!partial) {
    payload.technologies = [];
  }
  if (hasAny(body, ["images", "project_image", "image", "thumbnail"])) {
    payload.images = toArray(body.images || body.project_image || body.image || body.thumbnail);
  } else if (!partial) {
    payload.images = [];
  }
  if (hasAny(body, ["client", "clientName", "clientWebsite"])) {
    payload.client =
      typeof body.client === "object" && body.client !== null
        ? body.client
        : {
            name: body.clientName || body.client || "",
            website: body.clientWebsite || "",
          };
  }
  if (hasAny(body, ["links", "demo", "link", "preview", "repository", "caseStudy"])) {
    payload.links =
      typeof body.links === "object" && body.links !== null
        ? body.links
        : {
            demo: body.demo || body.link || body.preview || "",
            repository: body.repository || "",
            caseStudy: body.caseStudy || "",
          };
  }
  if (body.status !== undefined) {
    payload.status = String(body.status).toLowerCase();
  } else if (!partial) {
    payload.status = "completed";
  }
  if (body.featured !== undefined) {
    payload.featured = toBooleanOrUndefined(body.featured);
  } else if (!partial) {
    payload.featured = false;
  }
  if (body.isActive !== undefined) payload.isActive = toBooleanOrUndefined(body.isActive);

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const includeDisabled = req.query.includeDisabled === "true";
    const filter = includeDisabled ? {} : { isActive: { $ne: false } };
    const projects = await Project.find(filter)
      .populate("category", "title") // populate service title
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

exports.getAllProjectsAdmin = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("category", "title")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("category", "title");
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Get project by slug
exports.getProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const project = await Project.findOne({ slug, isActive: { $ne: false } })
      .populate("category", "title");

    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const project = new Project(normalizePayload(req.body));
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Project.findByIdAndUpdate(id, normalizePayload(req.body, { partial: true }), {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
