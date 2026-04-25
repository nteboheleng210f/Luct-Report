const { db } = require("../config/firebase");

// ===============================
// COURSES
// ===============================
const getCourses = async (req, res) => {
  try {
    const snap = await db.collection("courses").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// REPORTS (with optional feedback)
// ===============================
const getReports = async (req, res) => {
  try {
    const snap = await db.collection("lectureReports").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// ADD FEEDBACK TO REPORT
// ===============================
const addReportFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    await db.collection("lectureReports").doc(id).update({
      feedback,
      feedbackAt: new Date().toISOString(),
    });

    res.json({ message: "Feedback saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// RATINGS
// ===============================
const getRatings = async (req, res) => {
  try {
    const snap = await db.collection("ratings").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// MONITORING
// ===============================
const getMonitoring = async (req, res) => {
  try {
    const [reportsSnap, ratingsSnap, usersSnap] = await Promise.all([
      db.collection("lectureReports").get(),
      db.collection("ratings").get(),
      db.collection("users").get(),
    ]);

    const lecturers = usersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.role === "lecturer");

    // Attach report & rating counts per lecturer
    const data = lecturers.map(lecturer => {
      const reportCount = reportsSnap.docs.filter(
        d => d.data().lecturerId === lecturer.id
      ).length;

      const lecturerRatings = ratingsSnap.docs
        .filter(d => d.data().lecturerId === lecturer.id)
        .map(d => d.data().rating);

      const avgRating = lecturerRatings.length
        ? (lecturerRatings.reduce((a, b) => a + b, 0) / lecturerRatings.length).toFixed(1)
        : null;

      return { ...lecturer, reportCount, avgRating };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCourses,
  getReports,
  addReportFeedback,
  getRatings,
  getMonitoring,
};