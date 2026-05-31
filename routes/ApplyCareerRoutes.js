const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  applyCareer,
  deleteAppliedCareer,
  getAppliedCareers,
  getAppliedCareersByCareer,
  updateAppliedCareer,
} = require("../controllers/ApplyCareerController");
const { protect, admin } = require("../middleware/authMiddleware");

const formParser = multer();

router.post("/apply_career", formParser.none(), applyCareer);
router.get("/view_appliedcareer", protect, admin, getAppliedCareers);
router.get("/view_appliedcareer/:id", protect, admin, getAppliedCareersByCareer);
router.put("/view_appliedcareer/:id", protect, admin, updateAppliedCareer);
router.delete("/view_appliedcareer/:id", protect, admin, deleteAppliedCareer);

module.exports = router;
