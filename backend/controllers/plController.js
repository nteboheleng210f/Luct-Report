const { db } = require("../config/firebase");


// ===============================
// PL DASHBOARD STATS
// ===============================
const getPLStats = async (req, res) => {
  try {
    const coursesSnap = await db.collection("courses").get();
    const classesSnap = await db.collection("classSchedules").get();
    const reportsSnap = await db.collection("lectureReports").get();
    const usersSnap = await db.collection("users").get();

    const lecturers = usersSnap.docs
      .map(d => d.data())
      .filter(u => u.role === "lecturer").length;

    res.json({
      courses: coursesSnap.size,
      classes: classesSnap.size,
      reports: reportsSnap.size,
      lecturers
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// COURSES LIST
// ===============================
const getCourses = async (req, res) => {
  try {
    const snap = await db.collection("courses").get();

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// CLASSES LIST
// ===============================
const getClasses = async (req, res) => {
  try {
    const snap = await db.collection("classSchedules").get();

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// REPORTS
// ===============================
const getReports = async (req, res) => {
  try {
    const snap = await db.collection("lectureReports").get();

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPLStats,
  getCourses,
  getClasses,
  getReports
};