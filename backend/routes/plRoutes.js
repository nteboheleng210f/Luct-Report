const router = require("express").Router();

const {
  getPLStats,
  getCourses,
  getClasses,
  getReports
} = require("../controllers/plController");

router.get("/stats", getPLStats);
router.get("/courses", getCourses);
router.get("/classes", getClasses);
router.get("/reports", getReports);

module.exports = router;