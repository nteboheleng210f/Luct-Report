const { db } = require("../config/firebase");

// GET /api/classes/init/:userId
const getClassInit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const role = userDoc.data().role || "student";
    let schedules = [];
    let students  = [];

    if (role === "lecturer") {
      const snap = await db.collection("courses")
        .where("lecturerId", "==", userId).get();
      schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const [schedSnap, usersSnap] = await Promise.all([
        db.collection("classSchedules").get(),
        db.collection("users").get(), // fetch ALL, filter in code
      ]);

      schedules = schedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      students = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => (u.role || "").trim().toLowerCase() === "student")
        .map(({ password, ...rest }) => rest); // never send hashed password to client
    }

    res.json({ role, schedules, students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/classes
const createClass = async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await db.collection("classSchedules").add(payload);
    res.json({ id: ref.id, ...payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/classes/assign
const assignStudent = async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    await db.collection("users").doc(studentId).update({ classId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClassInit, createClass, assignStudent };