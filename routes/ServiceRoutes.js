const express = require("express");
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/ServicesController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getServices);
router.get("/:id", getServiceById);

// Admin routes
router.post("/", protect, admin, createService);
router.put("/:id", protect, admin, updateService);
router.delete("/:id", protect, admin, deleteService);

module.exports = router;
