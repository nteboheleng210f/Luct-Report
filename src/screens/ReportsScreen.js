import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";

import { auth, db } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function ReportsScreen() {
  const user = auth.currentUser;

  const [role, setRole] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [feedbackMap, setFeedbackMap] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  // ================= LOAD =================
  useEffect(() => {
    const load = async () => {
      try {
        const userSnap = await getDocs(collection(db, "users"));

        const me = userSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .find(u => u.id === user.uid);

        setRole(me?.role);

        const reportSnap = await getDocs(collection(db, "lectureReports"));

        setReports(
          reportSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ================= PRL FEEDBACK =================
  const submitFeedback = async (id) => {
    const feedback = feedbackMap[id];

    if (!feedback) {
      Alert.alert("Enter feedback first");
      return;
    }

    try {
      await updateDoc(doc(db, "lectureReports", id), {
        prlFeedback: feedback,
        status: "reviewed",
      });

      Alert.alert("Success", "Feedback saved");

      setFeedbackMap(prev => ({ ...prev, [id]: "" }));

      // refresh local state
      setReports(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, prlFeedback: feedback, status: "reviewed" }
            : r
        )
      );

    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // ================= FULL REPORT VIEW =================
  const ReportDetails = ({ report, onClose }) => {
    return (
      <ScrollView style={styles.fullView}>
        <Text style={styles.title}>📄 Full Report</Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: "#60a5fa", marginBottom: 10 }}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.item}>Course: {report.courseName} ({report.courseCode})</Text>
        <Text style={styles.item}>Lecturer: {report.lecturerName}</Text>
        <Text style={styles.item}>Faculty: {report.facultyName}</Text>
        <Text style={styles.item}>Class: {report.className}</Text>
        <Text style={styles.item}>Venue: {report.venue}</Text>
        <Text style={styles.item}>Time: {report.scheduledTime}</Text>

        <Text style={styles.item}>Week: {report.week}</Text>
        <Text style={styles.item}>Date: {report.date}</Text>

        <Text style={styles.item}>Topic: {report.topic}</Text>
        <Text style={styles.item}>Outcomes: {report.outcomes}</Text>
        <Text style={styles.item}>Recommendations: {report.recommendations}</Text>

        <Text style={styles.item}>
          Attendance: {report.actualPresent}/{report.totalRegistered}
        </Text>

        <Text style={styles.feedbackBox}>
          PRL Feedback: {report.prlFeedback || "No feedback yet"}
        </Text>
      </ScrollView>
    );
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white" }}>Loading Reports...</Text>
      </View>
    );
  }

  // ================= OPEN FULL REPORT =================
  if (selectedReport) {
    return (
      <ReportDetails
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    );
  }

  // ================= LECTURER =================
  if (role === "lecturer") {
    const myReports = reports.filter(r => r.lecturerId === user.uid);

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📘 My Lecture Reports</Text>

        {myReports.map(r => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => setSelectedReport(r)}
          >
            <Text style={styles.text}>
              {r.courseName} ({r.courseCode})
            </Text>
            <Text style={styles.sub}>Class: {r.className}</Text>
            <Text style={styles.sub}>Topic: {r.topic}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ================= PRL =================
  if (role === "prl") {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📊 PRL Review Dashboard</Text>

        {reports.map(r => (
          <View key={r.id} style={styles.card}>

            <TouchableOpacity onPress={() => setSelectedReport(r)}>
              <Text style={styles.text}>
                {r.courseName} ({r.courseCode})
              </Text>

              <Text style={styles.sub}>Lecturer: {r.lecturerName}</Text>
              <Text style={styles.sub}>Class: {r.className}</Text>
              <Text style={styles.sub}>Topic: {r.topic}</Text>
              <Text style={styles.sub}>Week: {r.week}</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="PRL Feedback..."
              placeholderTextColor="#94a3b8"
              value={feedbackMap[r.id] || ""}
              onChangeText={(t) =>
                setFeedbackMap(prev => ({ ...prev, [r.id]: t }))
              }
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={() => submitFeedback(r.id)}
            >
              <Text style={styles.btnText}>Submit Feedback</Text>
            </TouchableOpacity>

          </View>
        ))}
      </ScrollView>
    );
  }

  // ================= PL =================
  const reviewed = reports.filter(r => r.status === "reviewed");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📘 PL Final Reports</Text>

      {reviewed.map(r => (
        <TouchableOpacity
          key={r.id}
          style={styles.card}
          onPress={() => setSelectedReport(r)}
        >
          <Text style={styles.text}>
            {r.courseName} ({r.courseCode})
          </Text>

          <Text style={styles.sub}>Lecturer: {r.lecturerName}</Text>
          <Text style={styles.sub}>Class: {r.className}</Text>
          <Text style={styles.sub}>Topic: {r.topic}</Text>

          <Text style={styles.feedback}>
            PRL Feedback: {r.prlFeedback}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
    padding: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#111c3a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  text: {
    color: "#60a5fa",
    fontWeight: "bold",
  },

  sub: {
    color: "#cbd5e1",
    fontSize: 12,
  },

  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },

  btn: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
  },

  feedback: {
    color: "#fbbf24",
    marginTop: 6,
    fontSize: 12,
  },

  fullView: {
    flex: 1,
    backgroundColor: "#0b1220",
    padding: 15,
  },

  item: {
    color: "white",
    marginBottom: 8,
  },

  feedbackBox: {
    marginTop: 10,
    color: "#fbbf24",
    fontWeight: "bold",
  },
});