const router = require("express").Router();
const {
  getCourses,
  getReports,
  addReportFeedback,
  getRatings,
  getMonitoring,
} = require("../controllers/prlController");

router.get("/courses", getCourses);
router.get("/reports", getReports);
router.patch("/reports/:id/feedback", addReportFeedback);
router.get("/ratings", getRatings);
router.get("/monitoring", getMonitoring);

module.exports = router;