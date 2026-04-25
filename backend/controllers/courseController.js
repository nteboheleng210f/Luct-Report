const { db } = require("../config/firebase");


const getCourseInit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const role = userDoc.data().role || "student";

    const [courseSnap, classSnap, usersSnap] = await Promise.all([
      db.collection("courses").get(),
      db.collection("classSchedules").get(),
      db.collection("users").get(),
    ]);

    const courses = courseSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const classes = classSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const lecturers = usersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.role === "lecturer");

    res.json({ role, courses, classes, lecturers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await db.collection("courses").add(payload);
    res.json({ id: ref.id, ...payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCourseInit, createCourse };