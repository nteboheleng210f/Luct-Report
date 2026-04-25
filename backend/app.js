const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const plRoutes = require("./routes/plRoutes");
const prlRoutes = require("./routes/prlRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const classRoutes = require("./routes/classRoutes");
const reportRoutes = require("./routes/reportRoutes");
const courseRoutes = require("./routes/courseRoutes");
const lectureReportRoutes = require("./routes/lectureReportRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/pl", plRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/prl", prlRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lecture-reports", lectureReportRoutes);
module.exports = app;