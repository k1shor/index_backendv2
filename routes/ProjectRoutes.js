const express = require("express");
const router = express.Router();
const projectController = require("../controllers/ProjectController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", projectController.getAllProjects);
router.get("/:slug", projectController.getProjectBySlug);

// Admin routes (CRUD) - Protected
router.post("/", protect, admin, projectController.createProject);
router.put("/:id", protect, admin, projectController.updateProject);
router.delete("/:id", protect, admin, projectController.deleteProject);

module.exports = router;
