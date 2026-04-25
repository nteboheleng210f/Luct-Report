const express = require("express");
const router = express.Router();

const {
  getLecturerStats,
} = require("../controllers/lecturerController");

// GET DASHBOARD STATS
router.get("/stats/:lecturerId", getLecturerStats);

module.exports = router;