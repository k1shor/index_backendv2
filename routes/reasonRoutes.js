const express = require("express");
const router = express.Router();

const {
  getReasons,
  createReason,
  updateReason,
  deleteReason,
} = require("../controllers/ReasonsController");

const upload = require("../middleware/cloudinaryUpload")("reasons");

router.get("/", getReasons);
router.post("/", upload.single("reason_image"), createReason);
router.put("/:id", upload.single("reason_image"), updateReason);
router.delete("/:id", deleteReason);

module.exports = router;
