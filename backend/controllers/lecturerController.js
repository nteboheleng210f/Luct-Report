const { db } = require("../config/firebase");


const getLecturerStats = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const coursesSnap = await db.collection("courses").get();
    const reportsSnap = await db.collection("lectureReports").get();
    const ratingsSnap = await db.collection("ratings").get();
    const classesSnap = await db.collection("classSchedules").get();

    const courses = coursesSnap.docs.map(d => d.data())
      .filter(c => c.lecturerId === lecturerId);

    const classes = classesSnap.docs.map(d => d.data())
      .filter(c => c.lecturerId === lecturerId);

    const reports = reportsSnap.docs.map(d => d.data())
      .filter(r => r.lecturerId === lecturerId);

    const ratings = ratingsSnap.docs.map(d => d.data())
      .filter(r => r.lecturerId === lecturerId);

    res.json({
      courses: courses.length,
      classes: classes.length,
      reports: reports.length,
      ratings: ratings.length,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getLecturerStats,
};