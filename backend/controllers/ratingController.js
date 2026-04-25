const { db } = require("../config/firebase");

// GET /api/ratings/init/:userId
// Returns role + all ratings + courses for the user's class (if student)
const getRatingInit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc  = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const me   = { id: userDoc.id, ...userDoc.data() };
    const role = me.role || "student";

    const ratingsSnap = await db.collection("ratings").get();
    const ratings = ratingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let courses = [];
    if (role === "student" && me.classId) {
      const courseSnap = await db.collection("courses")
        .where("classId", "==", me.classId).get();

      courses = courseSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          lecturerUsername: data.lecturerUsername || data.lecturerName ||
                            data.username || data.displayName || "Unknown Lecturer",
        };
      });
    }

    res.json({ role, ratings, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ratings
const submitRating = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection("ratings").add(payload);
    res.json({ id: ref.id, ...payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRatingInit, submitRating };