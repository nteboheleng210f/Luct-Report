import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { auth } from "../firebase/config";

const API_URL = "http://10.115.113.31:5000/api";

export default function CoursesScreen() {
  const user = auth.currentUser;

  const [role,     setRole]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  const [courses,   setCourses]   = useState([]);
  const [classes,   setClasses]   = useState([]);   // from classSchedules collection
  const [lecturers, setLecturers] = useState([]);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const [selectedClass,    setSelectedClass]    = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const [showClassDropdown,    setShowClassDropdown]    = useState(false);
  const [showLecturerDropdown, setShowLecturerDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // classes in the response come from classSchedules (see getCourseInit backend)
        const res = await fetch(`${API_URL}/courses/init/${user.uid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setRole(data.role);
        setCourses(data.courses     || []);
        setClasses(data.classes     || []);   // classSchedules docs
        setLecturers(data.lecturers || []);
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const createCourse = async () => {
    if (!courseName || !courseCode || !selectedClass || !selectedLecturer) {
      Alert.alert("Missing Info", "Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          courseCode,
          classId:      selectedClass.id,
          className:    selectedClass.className,
          venue:        selectedClass.venue,
          day:          selectedClass.day,
          time:         selectedClass.time,
          lecturerId:   selectedLecturer.id,
          lecturerName: selectedLecturer.username || selectedLecturer.email,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newCourse = await res.json();
      setCourses(prev => [...prev, newCourse]);
      Alert.alert("Success", "Course created successfully");
      setCourseName(""); setCourseCode("");
      setSelectedClass(null); setSelectedLecturer(null);
      setShowClassDropdown(false); setShowLecturerDropdown(false);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.pageTitle}>
            {role === "prl" ? "PRL Courses Overview" : "Courses Management"}
          </Text>
          <Text style={styles.pageSub}>
            {role === "prl"
              ? "View all modules • assigned lecturers"
              : "Create modules • assign lecturers"}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📚</Text>
        </View>
      </View>

      {/* Create form (PL only) */}
      {role !== "prl" && (
        <>
          <Text style={styles.sectionLabel}>CREATE NEW COURSE</Text>
          <View style={styles.formCard}>

            <Text style={styles.fieldLabel}>Course Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Database Systems"
              placeholderTextColor="#475569"
              value={courseName}
              onChangeText={setCourseName}
            />

            <Text style={styles.fieldLabel}>Course Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BIS1213"
              placeholderTextColor="#475569"
              value={courseCode}
              onChangeText={setCourseCode}
            />

            {/* Class schedule dropdown — data from classSchedules collection */}
            <Text style={styles.fieldLabel}>Select Class Schedule</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setShowClassDropdown(!showClassDropdown);
                setShowLecturerDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedClass
                  ? `${selectedClass.className} — ${selectedClass.venue}`
                  : "Choose Class Schedule"}
              </Text>
              <Text style={styles.dropdownArrow}>{showClassDropdown ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {showClassDropdown && (
              classes.length === 0 ? (
                <View style={styles.emptyDropdown}>
                  <Text style={styles.emptyDropdownText}>
                    No class schedules found. Create one in the Class &amp; Timetable screen first.
                  </Text>
                </View>
              ) : (
                classes.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.optionCard}
                    onPress={() => { setSelectedClass(item); setShowClassDropdown(false); }}
                  >
                    <Text style={styles.cardTitle}>{item.className}</Text>
                    {item.facultyName && (
                      <Text style={styles.cardSub}>{item.facultyName}</Text>
                    )}
                    <Text style={styles.cardSub}>
                      {[item.venue, item.day, item.time].filter(Boolean).join(" • ")}
                    </Text>
                  </TouchableOpacity>
                ))
              )
            )}

            {/* Lecturer dropdown */}
            <Text style={styles.fieldLabel}>Select Lecturer</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setShowLecturerDropdown(!showLecturerDropdown);
                setShowClassDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedLecturer
                  ? selectedLecturer.username || selectedLecturer.email
                  : "Choose Lecturer"}
              </Text>
              <Text style={styles.dropdownArrow}>{showLecturerDropdown ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {showLecturerDropdown && lecturers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.optionCard}
                onPress={() => { setSelectedLecturer(item); setShowLecturerDropdown(false); }}
              >
                <Text style={styles.cardTitle}>{item.username || item.email}</Text>
                {item.email && item.username && (
                  <Text style={styles.cardSub}>{item.email}</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.createBtn, loading && styles.disabledBtn]}
              onPress={createCourse}
              disabled={loading}
            >
              <Text style={styles.createBtnText}>
                {loading ? "Saving..." : "+ Create Course"}
              </Text>
            </TouchableOpacity>

          </View>
        </>
      )}

      {/* Courses list */}
      <Text style={styles.sectionLabel}>
        {role === "prl" ? "ALL COURSES" : "CREATED COURSES"}
      </Text>

      {courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No courses created yet</Text>
        </View>
      ) : (
        courses.map((item) => (
          <View key={item.id} style={styles.courseCard}>
            <Text style={styles.courseTitle}>
              {item.courseName} ({item.courseCode})
            </Text>
            <Text style={styles.metaText}>Lecturer: {item.lecturerName}</Text>
            <Text style={styles.metaText}>Class: {item.className} • {item.venue}</Text>
            <Text style={styles.metaText}>{item.day} • {item.time}</Text>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#070b18", padding: 16 },
  center:      { flex: 1, backgroundColor: "#070b18", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94a3b8", marginTop: 10, fontSize: 14 },

  headerCard: {
    backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 14, padding: 16, marginBottom: 18,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  pageTitle:      { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  pageSub:        { color: "#64748b", fontSize: 12, marginTop: 4 },
  headerIcon:     { width: 42, height: 42, borderRadius: 12, backgroundColor: "#0c2d4e", justifyContent: "center", alignItems: "center" },
  headerIconText: { fontSize: 18 },

  sectionLabel: { color: "#64748b", fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 10 },

  formCard: {
    backgroundColor: "#0f172a", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  fieldLabel: { color: "#94a3b8", fontSize: 12, marginBottom: 6, marginTop: 8, fontWeight: "500" },
  input: {
    backgroundColor: "#111827", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 10, padding: 12, color: "#f8fafc", marginBottom: 8, fontSize: 13,
  },

  dropdownBox: {
    backgroundColor: "#111827", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  dropdownText:  { color: "#f8fafc", fontSize: 13 },
  dropdownArrow: { color: "#94a3b8", fontSize: 12 },

  emptyDropdown: {
    backgroundColor: "#111827", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 10, padding: 14, marginBottom: 8,
  },
  emptyDropdownText: { color: "#64748b", fontSize: 12, textAlign: "center" },

  optionCard: {
    backgroundColor: "#111827", borderWidth: 0.5, borderColor: "#1e293b",
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  cardTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "600" },
  cardSub:   { color: "#64748b", fontSize: 12, marginTop: 4 },

  createBtn:     { backgroundColor: "#2563eb", padding: 13, borderRadius: 10, alignItems: "center", marginTop: 12 },
  disabledBtn:   { opacity: 0.6 },
  createBtnText: { color: "#dbeafe", fontWeight: "700", fontSize: 13 },

  emptyCard: { backgroundColor: "#0f172a", borderRadius: 14, padding: 20, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 13 },

  courseCard: {
    backgroundColor: "#0f172a", borderLeftWidth: 3, borderLeftColor: "#2563eb",
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  courseTitle: { color: "#93c5fd", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  metaText:    { color: "#94a3b8", fontSize: 12, marginBottom: 4 },
});