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

import { auth } from "../firebase/config";

const API_URL = "http://10.115.113.31:5000/api";

export default function ReportsScreen() {
  const user = auth.currentUser;

  const [role,           setRole]           = useState(null);
  const [reports,        setReports]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [feedbackMap,    setFeedbackMap]    = useState({});
  const [submittingMap,  setSubmittingMap]  = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  // ── Load ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/init/${user.uid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRole(data.role);
        setReports(data.reports || []);
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── PRL submit feedback ──────────────────────────────────
  const submitFeedback = async (id) => {
    const feedback = feedbackMap[id];
    if (!feedback?.trim()) { Alert.alert("Enter feedback first"); return; }

    setSubmittingMap(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}/reports/${id}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Success", "Feedback saved");
      setFeedbackMap(prev => ({ ...prev, [id]: "" }));
      setReports(prev =>
        prev.map(r =>
          r.id === id ? { ...r, prlFeedback: feedback, status: "reviewed" } : r
        )
      );
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmittingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  // ── Full report detail view ──────────────────────────────
  const ReportDetails = ({ report, onClose }) => (
    <ScrollView style={styles.fullView}>
      <Text style={styles.title}>📄 Full Report</Text>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.detailCard}>
        <DetailRow label="Course"      value={`${report.courseName} (${report.courseCode})`} />
        <DetailRow label="Lecturer"    value={report.lecturerName} />
        <DetailRow label="Faculty"     value={report.facultyName} />
        <DetailRow label="Class"       value={report.className} />
        <DetailRow label="Venue"       value={report.venue} />
        <DetailRow label="Time"        value={report.scheduledTime} />
        <DetailRow label="Week"        value={report.week} />
        <DetailRow label="Date"        value={report.date} />
        <DetailRow label="Topic"       value={report.topic} />
        <DetailRow label="Outcomes"    value={report.outcomes} />
        <DetailRow label="Recommendations" value={report.recommendations} />
        <DetailRow label="Attendance"  value={`${report.actualPresent} / ${report.totalRegistered}`} />
      </View>

      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackLabel}>PRL Feedback</Text>
        <Text style={styles.feedbackText}>
          {report.prlFeedback || "No feedback yet"}
        </Text>
      </View>
    </ScrollView>
  );

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading Reports...</Text>
      </View>
    );
  }

  // ── Full report open ─────────────────────────────────────
  if (selectedReport) {
    return <ReportDetails report={selectedReport} onClose={() => setSelectedReport(null)} />;
  }

  // ── LECTURER view ────────────────────────────────────────
  if (role === "lecturer") {
    const myReports = reports.filter(r => r.lecturerId === user.uid);
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📘 My Lecture Reports</Text>
        {myReports.length === 0 && <Text style={styles.emptyText}>No reports submitted yet.</Text>}
        {myReports.map(r => (
          <TouchableOpacity key={r.id} style={styles.card} onPress={() => setSelectedReport(r)}>
            <Text style={styles.cardTitle}>{r.courseName} ({r.courseCode})</Text>
            <Text style={styles.sub}>Class: {r.className}</Text>
            <Text style={styles.sub}>Topic: {r.topic}</Text>
            <Text style={styles.sub}>Week {r.week}  ·  {r.date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── PRL view ─────────────────────────────────────────────
  if (role === "prl") {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📊 PRL Review Dashboard</Text>
        {reports.length === 0 && <Text style={styles.emptyText}>No reports found.</Text>}
        {reports.map(r => (
          <View key={r.id} style={styles.card}>
            <TouchableOpacity onPress={() => setSelectedReport(r)}>
              <Text style={styles.cardTitle}>{r.courseName} ({r.courseCode})</Text>
              <Text style={styles.sub}>Lecturer: {r.lecturerName}</Text>
              <Text style={styles.sub}>Class: {r.className}  ·  Week {r.week}</Text>
              <Text style={styles.sub}>Topic: {r.topic}</Text>
              {r.prlFeedback && (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedText}>✓ Reviewed</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Add PRL feedback…"
              placeholderTextColor="#475569"
              value={feedbackMap[r.id] || ""}
              onChangeText={(t) => setFeedbackMap(prev => ({ ...prev, [r.id]: t }))}
              multiline
            />

            <TouchableOpacity
              style={[styles.btn, submittingMap[r.id] && { opacity: 0.6 }]}
              onPress={() => submitFeedback(r.id)}
              disabled={!!submittingMap[r.id]}
            >
              <Text style={styles.btnText}>
                {submittingMap[r.id] ? "Saving…" : "Submit Feedback"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── PL view ──────────────────────────────────────────────
  const reviewed = reports.filter(r => r.status === "reviewed");
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📘 PL Final Reports</Text>
      {reviewed.length === 0 && <Text style={styles.emptyText}>No reviewed reports yet.</Text>}
      {reviewed.map(r => (
        <TouchableOpacity key={r.id} style={styles.card} onPress={() => setSelectedReport(r)}>
          <Text style={styles.cardTitle}>{r.courseName} ({r.courseCode})</Text>
          <Text style={styles.sub}>Lecturer: {r.lecturerName}</Text>
          <Text style={styles.sub}>Class: {r.className}  ·  Week {r.week}</Text>
          <Text style={styles.sub}>Topic: {r.topic}</Text>
          <View style={styles.feedbackInline}>
            <Text style={styles.feedbackInlineLabel}>PRL Feedback: </Text>
            <Text style={styles.feedbackInlineText}>{r.prlFeedback}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#0b1220", padding: 15 },
  center:      { flex: 1, backgroundColor: "#0b1220", justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { color: "#64748b", fontSize: 14 },
  emptyText:   { color: "#475569", fontSize: 13, marginTop: 10 },

  title: { color: "#f1f5f9", fontSize: 20, fontWeight: "800", marginBottom: 14 },

  card: {
    backgroundColor: "#111c3a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#1e293b",
  },
  cardTitle: { color: "#60a5fa", fontWeight: "700", fontSize: 14, marginBottom: 4 },
  sub:       { color: "#94a3b8", fontSize: 12, marginBottom: 2 },

  reviewedBadge: { marginTop: 6, alignSelf: "flex-start", backgroundColor: "#052e16", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  reviewedText:  { color: "#4ade80", fontSize: 11, fontWeight: "600" },

  input: {
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: "top",
  },
  btn:     { backgroundColor: "#2563eb", padding: 10, borderRadius: 8, marginTop: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  feedbackInline:      { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  feedbackInlineLabel: { color: "#fbbf24", fontSize: 12, fontWeight: "600" },
  feedbackInlineText:  { color: "#fcd34d", fontSize: 12, flex: 1 },

  // Full report view
  fullView:  { flex: 1, backgroundColor: "#0b1220", padding: 15 },
  backLink:  { color: "#60a5fa", fontSize: 13, marginBottom: 14 },
  detailCard: { backgroundColor: "#111c3a", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: "#1e293b" },
  detailRow:  { flexDirection: "row", marginBottom: 8, flexWrap: "wrap" },
  detailLabel:{ color: "#475569", fontSize: 12, fontWeight: "600", width: 120 },
  detailValue:{ color: "#f1f5f9", fontSize: 12, flex: 1 },
  feedbackBox:   { backgroundColor: "#1a1200", borderWidth: 0.5, borderColor: "#7a4f00", borderRadius: 12, padding: 14 },
  feedbackLabel: { color: "#fbbf24", fontWeight: "700", fontSize: 13, marginBottom: 6 },
  feedbackText:  { color: "#fcd34d", fontSize: 13, lineHeight: 20 },
});