const Service = require("../models/ServiceModel");

/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Admin
 */
exports.createService = async (req, res) => {
  try {
    const { title, slug, short_description, description, image } = req.body;

    const serviceExists = await Service.findOne({ slug });
    if (serviceExists) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const service = new Service({
      title,
      slug,
      short_description,
      description,
      image,
      createdBy: req.user._id, // comes from JWT middleware
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Admin
 */
exports.updateService = async (req, res) => {
  try {
    const { title, slug, short_description, description, image } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.title = title || service.title;
    service.slug = slug || service.slug;
    service.short_description = short_description || service.short_description;
    service.description = description || service.description;
    service.image = image || service.image;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Admin
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    await service.deleteOne();
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
