const { db } = require("../config/firebase");
const admin = require("firebase-admin");

const getClassInit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const role = userDoc.data().role || "student";

  
    const classSnap = await db.collection("classSchedules").get();

    const schedules = classSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

 
    const usersSnap = await db.collection("users").get();

    const students = usersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => (u.role || "").toLowerCase() === "student")
      .map(({ password, ...rest }) => rest);

    console.log(
      "INIT → role:", role,
      "| classes:", schedules.length,
      "| students:", students.length
    );

    return res.json({
      role,
      schedules,
      students,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const createClass = async (req, res) => {
  try {
    const payload = {
      className: req.body.className,
      facultyName: req.body.facultyName,
      venue: req.body.venue,
      day: req.body.day,
      time: req.body.time,

      lecturerId: req.body.lecturerId || null, 

      students: [], 

      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("classSchedules").add(payload);

    return res.json({
      id: ref.id,
      ...payload,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const assignStudent = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    const classRef = db.collection("classSchedules").doc(classId);

    const classDoc = await classRef.get();
    if (!classDoc.exists) {
      return res.status(404).json({ message: "Class not found" });
    }

    const data = classDoc.data();
    const students = data.students || [];

    if (!students.includes(studentId)) {
      await classRef.update({
        students: admin.firestore.FieldValue.arrayUnion(studentId),
      });
    }

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



module.exports = {
  getClassInit,
  createClass,
  assignStudent,
};