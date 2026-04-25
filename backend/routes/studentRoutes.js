const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getUpcomingClass,
  getAttendance,
  getRatings
} = require("../controllers/studentController");

router.get("/stats/:userId", getDashboardStats);
router.get("/upcoming/:userId", getUpcomingClass);
router.get("/attendance/:userId", getAttendance);
router.get("/ratings/:userId", getRatings);

module.exports = router;