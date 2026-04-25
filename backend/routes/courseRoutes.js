const router = require("express").Router();
const { getCourseInit, createCourse } = require("../controllers/courseController");

router.get("/init/:userId", getCourseInit);
router.post("/", createCourse);

module.exports = router;