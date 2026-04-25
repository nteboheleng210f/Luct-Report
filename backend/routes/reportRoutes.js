const router = require("express").Router();
const { getReportInit, submitFeedback } = require("../controllers/reportController");

router.get("/init/:userId", getReportInit);
router.patch("/:id/feedback", submitFeedback);

module.exports = router;