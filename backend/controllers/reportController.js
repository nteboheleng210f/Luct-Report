const { db } = require("../config/firebase");

// GET /api/reports/init/:userId
const getReportInit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const role = userDoc.data().role || "student";

    const snap = await db.collection("lectureReports").get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ role, reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/reports/:id/feedback
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback?.trim()) {
      return res.status(400).json({ message: "Feedback is required" });
    }

    await db.collection("lectureReports").doc(id).update({
      prlFeedback: feedback,
      status: "reviewed",
      feedbackAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReportInit, submitFeedback };