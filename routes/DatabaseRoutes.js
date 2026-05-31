const express = require("express");
const multer = require("multer");
const { isAdmin } = require("../controllers/UserController");
const {
  createDatabaseBackup,
  restoreDatabaseBackup,
} = require("../controllers/DatabaseController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const uploadBackup = (req, res, next) => {
  upload.fields([
    { name: "backup", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    return next();
  });
};

router.get("/backup", isAdmin, createDatabaseBackup);
router.post("/restore", isAdmin, uploadBackup, restoreDatabaseBackup);

module.exports = router;
