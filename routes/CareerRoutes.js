const express = require("express");
const router = express.Router();
const {
  createCareer,
  deleteCareer,
  getAdminCareers,
  getCareerById,
  getCareers,
  updateCareer,
} = require("../controllers/CareerController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getCareers);
router.get("/view_career", getCareers);
router.get("/admin/all", protect, admin, getAdminCareers);
router.get("/view_careerdetailsbyid/:id", getCareerById);

router.post("/add_career", protect, admin, createCareer);
router.put("/update_career/:id", protect, admin, updateCareer);
router.delete("/delete_career/:id", protect, admin, deleteCareer);

module.exports = router;
