const router = require("express").Router();
const { getMissionVision } = require("../controllers/siteContentController");

router.get("/mission-vision", getMissionVision);

module.exports = router;
