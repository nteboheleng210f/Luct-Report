const { db } = require("../config/firebase");

const getMonitoringData = async (req, res) => {
  try {
    const { userId } = req.params;

    // get logged-in user
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const me = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    const role = me.role || "student";

    // get all users
    const usersSnap = await db.collection("users").get();
    const allUsers = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // get all reports
    const reportsSnap = await db.collection("lectureReports").get();
    const allReports = reportsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    let myAttendance = [];
    let classReports = [];
    let myReports = [];

    // STUDENT
    if (role === "student") {
      if (me.classId) {
        classReports = allReports.filter(
          r => r.classId === me.classId
        );
      }

      const attSnap = await db.collection("attendance").get();

      myAttendance = attSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(a => a.studentId === userId);
    }

    // LECTURER
    if (role === "lecturer") {
      myReports = allReports.filter(
        r => r.lecturerId === userId
      );
    }

    res.json({
      role,
      me,
      allUsers,
      allReports,
      myAttendance,
      classReports,
      myReports,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getMonitoringData,
};