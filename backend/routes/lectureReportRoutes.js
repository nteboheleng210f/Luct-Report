const router = require("express").Router();
const {
  getLecturerCourses,
  getCourseDetails,
  submitReport,
} = require("../controllers/lectureReportController");

router.get("/courses/:userId",          getLecturerCourses);
router.get("/course-details/:classId",  getCourseDetails);
router.post("/",                        submitReport);

module.exports = router;