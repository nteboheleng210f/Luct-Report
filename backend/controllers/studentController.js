const { db } = require("../config/firebase");


// DASHBOARD STATS
const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const attSnap = await db.collection("attendance").get();
    const ratingsSnap = await db.collection("ratings").get();

    const myAttendance = attSnap.docs
      .map(d => d.data())
      .filter(a => a.studentId === userId);

    const present = myAttendance.filter(a => a.status === "Present").length;

    const attendancePercent = myAttendance.length
      ? (present / myAttendance.length) * 100
      : 0;

    const myRatings = ratingsSnap.docs
      .map(d => d.data())
      .filter(r => r.studentId === userId);

    res.json({
      attendancePercent: attendancePercent.toFixed(1),
      ratingsCount: myRatings.length,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// UPCOMING CLASS
const getUpcomingClass = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    const user = userDoc.data();

    const classSnap = await db.collection("classSchedules").get();

    const classes = classSnap.docs.map(d => d.data());

    const myClasses = classes.filter(
      c => c.className === user.className || c.classId === user.classId
    );

    res.json(myClasses);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ATTENDANCE
const getAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    const snap = await db.collection("attendance").get();

    const data = snap.docs
      .map(d => d.data())
      .filter(a => a.studentId === userId);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// RATINGS
const getRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const snap = await db.collection("ratings").get();

    const data = snap.docs
      .map(d => d.data())
      .filter(r => r.studentId === userId);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getUpcomingClass,
  getAttendance,
  getRatings
};