const { db } = require("../config/firebase");


// GET ATTENDANCE DATA (student + lecturer)
const getAttendanceData = async (req, res) => {
  try {
    const { userId } = req.params;

    // current user
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    const role = user.role || "student";

    let courses = [];
    let studentRecords = [];

    // =========================
    // LECTURER VIEW
    // =========================
    if (role === "lecturer") {
      const courseSnap = await db.collection("courses").get();

      courses = courseSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(course => course.lecturerId === userId);
    }

    // =========================
    // STUDENT VIEW
    // =========================
    if (role === "student") {
      const attSnap = await db.collection("attendance").get();

      studentRecords = attSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(record => record.studentId === userId);
    }

    res.json({
      role,
      courses,
      studentRecords,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// LOAD STUDENTS FOR COURSE
const getCourseStudents = async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();

    const students = usersSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(user => user.role === "student");

    res.json(students);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// SAVE ATTENDANCE
const saveAttendance = async (req, res) => {
  try {
    const {
      lecturerId,
      selectedCourse,
      students,
      attendance,
    } = req.body;

    if (!selectedCourse) {
      return res.status(400).json({
        message: "Course required",
      });
    }

    const promises = students.map(student =>
      db.collection("attendance").add({
        studentId: student.id,
        studentName: student.username || student.email,
        courseId: selectedCourse.id,
        courseName: selectedCourse.courseName,
        classId: selectedCourse.classId,
        status: attendance[student.id] || "Present",
        date: new Date().toISOString(),
        lecturerId,
      })
    );

    await Promise.all(promises);

    res.json({
      message: "Attendance submitted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  getAttendanceData,
  getCourseStudents,
  saveAttendance,
};