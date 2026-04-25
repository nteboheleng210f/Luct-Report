const express = require("express");
const router = express.Router();

const {
  getAttendanceData,
  getCourseStudents,
  saveAttendance,
} = require("../controllers/attendanceController");

router.get("/:userId", getAttendanceData);

router.get("/students/list", getCourseStudents);

router.post("/save", saveAttendance);

module.exports = router;