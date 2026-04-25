const { db } = require("../config/firebase");

const getMonitoringData = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const me   = { id: userDoc.id, ...userDoc.data() };
    const role = me.role || "student";

    // ── STUDENT ──────────────────────────────────────────
    if (role === "student") {
      let classReports = [];

      if (me.classId) {
        const snap = await db.collection("lectureReports")
          .where("classId", "==", me.classId)
          .get();
        classReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const attSnap = await db.collection("attendance")
        .where("studentId", "==", userId)
        .get();
      const myAttendance = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return res.json({
        role,
        me,
        classReports,
        myAttendance,
        myReports:  [],
        allReports: [],
        allUsers:   [],
      });
    }

    // ── LECTURER ─────────────────────────────────────────
    if (role === "lecturer") {
      const snap = await db.collection("lectureReports")
        .where("lecturerId", "==", userId)
        .get();
      const myReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      return res.json({
        role,
        me,
        myReports,
        classReports: [],
        myAttendance: [],
        allReports:   [],
        allUsers:     [],
      });
    }

    // ── PRL ───────────────────────────────────────────────
    if (role === "prl") {
      const snap = await db.collection("lectureReports").get();
      const allReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      return res.json({
        role,
        me,
        allReports,
        myReports:    [],
        classReports: [],
        myAttendance: [],
        allUsers:     [],
      });
    }

    // ── PL / ADMIN ────────────────────────────────────────
    const [reportsSnap, usersSnap] = await Promise.all([
      db.collection("lectureReports").get(),
      db.collection("users").get(),
    ]);

    const allReports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const allUsers   = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.json({
      role,
      me,
      allReports,
      allUsers,
      myReports:    [],
      classReports: [],
      myAttendance: [],
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMonitoringData };