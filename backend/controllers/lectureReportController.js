const { db } = require("../config/firebase");

// GET /api/lecture-reports/courses/:userId
// Courses assigned to this lecturer
const getLecturerCourses = async (req, res) => {
  try {
    const snap = await db.collection("courses")
      .where("lecturerId", "==", req.params.userId).get();
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecture-reports/course-details/:classId
// Schedule info + student count for a class
const getCourseDetails = async (req, res) => {
  try {
    const { classId } = req.params;

    const [schedDoc, studSnap] = await Promise.all([
      db.collection("classSchedules").doc(classId).get(),
      db.collection("users").where("classId", "==", classId).get(),
    ]);

    const schedule = schedDoc.exists ? { id: schedDoc.id, ...schedDoc.data() } : null;
    const studentCount = studSnap.size;

    res.json({ schedule, studentCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecture-reports
const submitReport = async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await db.collection("lectureReports").add(payload);
    res.json({ id: ref.id, ...payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLecturerCourses, getCourseDetails, submitReport };