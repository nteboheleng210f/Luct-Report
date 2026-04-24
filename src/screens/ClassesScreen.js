import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";

import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

const getInitials = (name = "", email = "") => {
  const src = name || email;
  const parts = src.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

export default function ClassScheduleScreen() {

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  const [userRole, setUserRole] = useState(null);

  // Admin sees classSchedules; Lecturer sees courses assigned to them
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents]   = useState([]);

  const [selectedClassId, setSelectedClassId]     = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [assignedMap, setAssignedMap]             = useState({});

  // Form fields (admin only)
  const [className,   setClassName]   = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [venue,       setVenue]       = useState("");
  const [day,         setDay]         = useState("");
  const [time,        setTime]        = useState("");
  const [courseCode,  setCourseCode]  = useState("");
  const [courseName,  setCourseName]  = useState("");

  // ─────────────────────────────────────────────
  // Auth guard → then load correct collection
  // ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setFetching(false);
        Alert.alert("Error", "Not authenticated");
        return;
      }

      const uid = firebaseUser.uid;

      try {
        // 1. Get role
        const userDoc  = await getDoc(doc(db, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const role     = userData.role || "student";
        setUserRole(role);

        if (role === "lecturer") {
          // ── LECTURER: query the `courses` collection by lecturerId ──
          // This is where PL saves assigned courses with lecturerId field
          const q = query(
            collection(db, "courses"),
            where("lecturerId", "==", uid)
          );
          const snap = await getDocs(q);
          const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSchedules(results);

        } else {
          // ── ADMIN / PL: query `classSchedules` (all classes) ──
          const snap    = await getDocs(collection(db, "classSchedules"));
          const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSchedules(results);

          // Also load students for assignment
          const userSnap    = await getDocs(collection(db, "users"));
          const studentList = userSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.role === "student");
          setStudents(studentList);

          const map = {};
          studentList.forEach((s) => { if (s.classId) map[s.id] = s.classId; });
          setAssignedMap(map);
        }

      } catch (error) {
        Alert.alert("Load Error", error.message);
      } finally {
        setFetching(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ─────────────────────────────────────────────
  // Create class (admin only → classSchedules)
  // ─────────────────────────────────────────────
  const createSchedule = async () => {
    if (!className || !facultyName || !venue || !day || !time) {
      Alert.alert("Missing Info", "Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const payload = { className, facultyName, venue, day, time, courseCode, courseName, createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, "classSchedules"), payload);
      setSchedules((prev) => [...prev, { id: docRef.id, ...payload }]);
      setClassName(""); setFacultyName(""); setVenue("");
      setDay(""); setTime(""); setCourseCode(""); setCourseName("");
      Alert.alert("Success", "Class created successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Assign student (admin only)
  // ─────────────────────────────────────────────
  const assignStudent = async (studentId, classId) => {
    try {
      await updateDoc(doc(db, "users", studentId), { classId });
      setAssignedMap((prev) => ({ ...prev, [studentId]: classId }));
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // ─────────────────────────────────────────────
  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isLecturer = userRole === "lecturer";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* ── PAGE HEADER ── */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>
            {isLecturer ? "My Classes" : "Class & Timetable"}
          </Text>
          <Text style={styles.pageSub}>
            {isLecturer
              ? "Classes assigned to you by PL"
              : "Create classes · assign students"}
          </Text>
        </View>
        <View style={styles.pageIcon} />
      </View>

      {/* ══════════════════════════════════════════
          1. CLASS / COURSE LIST  (shown first)
      ══════════════════════════════════════════ */}
      <Text style={styles.sectionLabel}>
        {isLecturer ? "YOUR ASSIGNED COURSES" : "SCHEDULED CLASSES"}
      </Text>

      {schedules.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIconBox} />
          <Text style={styles.emptyStateTitle}>
            {isLecturer ? "No courses assigned yet" : "No classes created yet"}
          </Text>
          <Text style={styles.emptyStateText}>
            {isLecturer
              ? "Your PL has not assigned any courses to you yet.\nCheck back later or contact your programme leader."
              : "Use the form below to create your first class."}
          </Text>
        </View>
      ) : (
        schedules.map((item) => {
          const isActive = selectedClassId === item.id;
          return (
            <View
              key={item.id}
              style={[styles.classCard, isActive && styles.classCardActive]}
            >
              {/* Card top */}
              <View style={styles.classCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classCardName}>{item.className}</Text>
                  {(item.courseCode || item.courseName) && (
                    <Text style={styles.classCardCourse}>
                      {[item.courseCode, item.courseName].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </View>
                {isActive && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </View>

              {/* Meta chips */}
              <View style={styles.metaRow}>
                {item.facultyName  && <View style={styles.chip}><Text style={styles.chipText}>{item.facultyName}</Text></View>}
                {item.day && item.time && <View style={styles.chip}><Text style={styles.chipText}>{item.day}  {item.time}</Text></View>}
                {item.venue        && <View style={[styles.chip, styles.chipVenue]}><Text style={[styles.chipText, styles.chipTextVenue]}>{item.venue}</Text></View>}
                {item.lecturerName && <View style={[styles.chip, styles.chipLecturer]}><Text style={[styles.chipText, styles.chipTextLecturer]}>{item.lecturerName}</Text></View>}
              </View>

              {/* Lecturer: read-only badge strip */}
              {isLecturer && (
                <View style={styles.lecturerBadgeRow}>
                  <View style={styles.lecturerBadge}>
                    <Text style={styles.lecturerBadgeText}>Assigned to you</Text>
                  </View>
                </View>
              )}

              {/* Admin: assign students button */}
              {!isLecturer && (
                <TouchableOpacity
                  style={[styles.assignClassBtn, isActive && styles.assignClassBtnActive]}
                  onPress={() => {
                    if (isActive) { setSelectedClassId(null); setSelectedClassName(""); }
                    else { setSelectedClassId(item.id); setSelectedClassName(item.className); }
                  }}
                >
                  <Text style={[styles.assignClassBtnText, isActive && styles.assignClassBtnTextActive]}>
                    {isActive ? "Close student list" : "Assign students"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      {/* ── ASSIGN STUDENTS PANEL (admin only) ── */}
      {!isLecturer && selectedClassId && (
        <>
          <Text style={styles.sectionLabel}>ASSIGN STUDENTS — {selectedClassName}</Text>
          <View style={styles.studentPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderTitle}>Available students</Text>
              <Text style={styles.panelHeaderCount}>{students.length} students</Text>
            </View>

            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            ) : (
              students.map((s) => {
                const isAssigned = assignedMap[s.id] === selectedClassId;
                const initials   = getInitials(s.username, s.email);
                return (
                  <View key={s.id} style={styles.studentRow}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{s.username || s.email}</Text>
                      {s.username && s.email && (
                        <Text style={styles.studentEmail}>{s.email}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.assignBtn, isAssigned && styles.assignBtnDone]}
                      onPress={() => !isAssigned && assignStudent(s.id, selectedClassId)}
                      disabled={isAssigned}
                    >
                      <Text style={[styles.assignBtnText, isAssigned && styles.assignBtnTextDone]}>
                        {isAssigned ? "Assigned" : "Assign"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      {/* ══════════════════════════════════════════
          2. CREATE CLASS FORM (admin only, shown last)
      ══════════════════════════════════════════ */}
      {!isLecturer && (
        <>
          <Text style={styles.sectionLabel}>CREATE NEW CLASS</Text>
          <View style={styles.formCard}>

            <View style={styles.row2}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Class name</Text>
                <TextInput style={styles.input} placeholder="e.g. BSCSMY1"
                  placeholderTextColor="#334155" value={className} onChangeText={setClassName} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Faculty</Text>
                <TextInput style={styles.input} placeholder="FICT"
                  placeholderTextColor="#334155" value={facultyName} onChangeText={setFacultyName} />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Course code</Text>
                <TextInput style={styles.input} placeholder="BIS3001"
                  placeholderTextColor="#334155" value={courseCode} onChangeText={setCourseCode} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Course name</Text>
                <TextInput style={styles.input} placeholder="Security"
                  placeholderTextColor="#334155" value={courseName} onChangeText={setCourseName} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Venue</Text>
            <TextInput style={styles.input} placeholder="Room1"
              placeholderTextColor="#334155" value={venue} onChangeText={setVenue} />

            <View style={styles.row2}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Day</Text>
                <TextInput style={styles.input} placeholder="Monday"
                  placeholderTextColor="#334155" value={day} onChangeText={setDay} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Time</Text>
                <TextInput style={styles.input} placeholder="08:00 – 10:00"
                  placeholderTextColor="#334155" value={time} onChangeText={setTime} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createBtn, loading && styles.createBtnDisabled]}
              onPress={createSchedule}
              disabled={loading}
            >
              <Text style={styles.createBtnText}>
                {loading ? "Saving..." : "+ Create class"}
              </Text>
            </TouchableOpacity>

          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b18", padding: 16 },
  center: { flex: 1, backgroundColor: "#070b18", justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#64748b", fontSize: 14 },

  pageHeader: { backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:  { color: "#f1f5f9", fontSize: 17, fontWeight: "700" },
  pageSub:    { color: "#475569", fontSize: 12, marginTop: 2 },
  pageIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#1d4ed8" },

  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#475569", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },

  classCard: { backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b", borderLeftWidth: 3, borderLeftColor: "#2563eb", borderRadius: 14, padding: 14, marginBottom: 8 },
  classCardActive: { borderLeftColor: "#16a34a", backgroundColor: "#0a1f10" },
  classCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
  classCardName:   { fontSize: 14, fontWeight: "600", color: "#93c5fd" },
  classCardCourse: { fontSize: 11, color: "#60a5fa", marginTop: 2, opacity: 0.8 },
  selectedBadge: { backgroundColor: "#052e16", borderWidth: 0.5, borderColor: "#166534", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginLeft: 8 },
  selectedBadgeText: { fontSize: 10, color: "#4ade80", fontWeight: "600" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { backgroundColor: "#1e293b", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 11, color: "#94a3b8" },
  chipVenue: { backgroundColor: "#0c2240" },
  chipTextVenue: { color: "#60a5fa" },
  chipLecturer: { backgroundColor: "#1a1040" },
  chipTextLecturer: { color: "#a5b4fc" },

  lecturerBadgeRow: { flexDirection: "row" },
  lecturerBadge: { backgroundColor: "#0c2240", borderWidth: 0.5, borderColor: "#1e4080", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  lecturerBadgeText: { fontSize: 10, color: "#60a5fa", fontWeight: "600" },

  assignClassBtn: { backgroundColor: "#0f2d18", borderWidth: 0.5, borderColor: "#166534", borderRadius: 8, padding: 8, alignItems: "center" },
  assignClassBtnActive: { backgroundColor: "#1e293b", borderColor: "#334155" },
  assignClassBtnText: { fontSize: 12, fontWeight: "500", color: "#4ade80" },
  assignClassBtnTextActive: { color: "#64748b" },

  emptyStateCard: { backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b", borderRadius: 14, padding: 32, alignItems: "center", marginBottom: 16 },
  emptyStateIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#1e293b", marginBottom: 12 },
  emptyStateTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  emptyStateText:  { color: "#475569", fontSize: 12, textAlign: "center", lineHeight: 18 },

  studentPanel: { backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b", borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: "#1e293b" },
  panelHeaderTitle: { fontSize: 13, fontWeight: "500", color: "#f1f5f9" },
  panelHeaderCount: { fontSize: 11, color: "#475569" },
  emptyState: { padding: 24, alignItems: "center" },
  emptyText:  { color: "#475569", fontSize: 13 },
  studentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: "#0f172a" },
  studentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#1a1040", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 },
  studentAvatarText: { fontSize: 10, fontWeight: "600", color: "#a5b4fc" },
  studentInfo: { flex: 1 },
  studentName:  { fontSize: 13, color: "#f1f5f9" },
  studentEmail: { fontSize: 11, color: "#475569", marginTop: 1 },
  assignBtn: { backgroundColor: "#1d4ed8", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  assignBtnDone: { backgroundColor: "#052e16", borderWidth: 0.5, borderColor: "#166534" },
  assignBtnText: { fontSize: 11, fontWeight: "600", color: "#bfdbfe" },
  assignBtnTextDone: { color: "#4ade80" },

  formCard: { backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b", borderRadius: 14, padding: 14, marginBottom: 16 },
  row2: { flexDirection: "row", gap: 8 },
  fieldWrap: { flex: 1 },
  fieldLabel: { fontSize: 11, color: "#475569", fontWeight: "500", marginBottom: 4, marginTop: 4 },
  input: { backgroundColor: "#111827", borderWidth: 0.5, borderColor: "#1e293b", borderRadius: 8, padding: 10, fontSize: 13, color: "#f1f5f9", marginBottom: 8 },
  createBtn: { backgroundColor: "#1d4ed8", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 4 },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: "#bfdbfe", fontSize: 13, fontWeight: "600" },
});