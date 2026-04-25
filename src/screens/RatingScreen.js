import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { auth } from "../firebase/config";

const API_URL = "https://luct-reports-kggq.onrender.com/api";

const C = {
  navy:   "#0f1f3d",
  navy2:  "#1a2f52",
  gold:   "#c9a84c",
  white:  "#ffffff",
  bg:     "#f5f7fb",
  card:   "#ffffff",
  border: "#e4e8f0",
  text:   "#102040",
  muted:  "#6c7a96",
  badge:  "#edf0f7",
};

// ─── Sub-components (unchanged) ───────────────────────────

function StarPicker({ value, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={[styles.star, n <= value && styles.starActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CourseCard({ item, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.courseCard, selected && styles.courseCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.courseTitle}>{item.courseName}</Text>
        <View style={styles.courseMetaRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{item.courseCode}</Text>
          </View>
          <Text style={styles.courseLecturer}>
            {item.lecturerUsername || item.lecturerName || item.username || "No lecturer"}
          </Text>
        </View>
      </View>
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function RatingCard({ item, showLecturer = false }) {
  const initials = (item.studentName || "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.studentName}>{item.studentName || "Student"}</Text>
          <Text style={styles.ratingMeta}>
            {showLecturer ? `${item.lecturerName} · ` : ""}
            {item.courseName}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeNum}>{item.rating}</Text>
          <Text style={styles.ratingBadgeStar}>★</Text>
        </View>
      </View>
      <View style={styles.miniStarRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text
            key={n}
            style={[styles.miniStar, n <= item.rating ? styles.miniStarLit : styles.miniStarDim]}
          >★</Text>
        ))}
      </View>
      {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
      {!!dateStr && <Text style={styles.dateText}>{dateStr}</Text>}
    </View>
  );
}

function AverageBlock({ average, count }) {
  const rounded = parseFloat(average) || 0;
  return (
    <View style={styles.avgBlock}>
      <Text style={styles.avgScore}>{average ?? "–"}</Text>
      <View style={{ flexDirection: "column", gap: 4 }}>
        <View style={styles.avgStarRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Text
              key={n}
              style={[styles.avgStar, n <= Math.round(rounded) ? styles.avgStarLit : styles.avgStarDim]}
            >★</Text>
          ))}
        </View>
        <Text style={styles.avgCount}>
          {count} {count === 1 ? "review" : "reviews"}
        </Text>
      </View>
    </View>
  );
}

function SectionLabel({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

// ─── Main screen ──────────────────────────────────────────

export default function RatingScreen() {
  const user = auth.currentUser;

  const [role, setRole]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [courses, setCourses]               = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [ratings, setRatings]               = useState([]);
  const [rating, setRating]                 = useState(0);
  const [comment, setComment]               = useState("");
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // fetch role + ratings + courses in one call
        const res = await fetch(`${API_URL}/ratings/init/${user.uid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setRole(data.role);
        setRatings(data.ratings || []);
        setCourses(data.courses || []);
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submitRating = async () => {
    if (!selectedCourse)
      return Alert.alert("Select Course", "Please choose a course first.");
    if (!rating)
      return Alert.alert("Rating Required", "Please select a star rating.");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:    user.uid,
          studentName:  user.displayName || "Student",
          lecturerId:   selectedCourse.lecturerId,
          lecturerName: selectedCourse.lecturerUsername || selectedCourse.lecturerName || "Unknown",
          courseName:   selectedCourse.courseName,
          courseCode:   selectedCourse.courseCode,
          classId:      selectedCourse.classId,
          className:    selectedCourse.className,
          rating,
          comment:      comment.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Success", "Rating submitted successfully.");
      setSelectedCourse(null);
      setRating(0);
      setComment("");

      // refresh ratings list
      const refreshed = await fetch(`${API_URL}/ratings/init/${user.uid}`);
      const data = await refreshed.json();
      setRatings(data.ratings || []);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const lecturerRatings = ratings.filter((r) => r.lecturerId === user.uid);
  const average =
    lecturerRatings.length > 0
      ? (lecturerRatings.reduce((a, b) => a + b.rating, 0) / lecturerRatings.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.navy} />
      </View>
    );
  }

  // ── STUDENT VIEW ──
  if (role === "student") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Feedback</Text>
          <Text style={styles.headerTitle}>Rate Your Lecturer</Text>
          <Text style={styles.headerSub}>Choose a course from your class below</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionLabel text="Available Courses" />

          {courses.length === 0 ? (
            <Text style={styles.emptyText}>No courses found for your class.</Text>
          ) : (
            <FlatList
              data={courses}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <CourseCard
                  item={item}
                  selected={selectedCourse?.id === item.id}
                  onPress={() => setSelectedCourse(item)}
                />
              )}
            />
          )}

          {selectedCourse && (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryLabel}>Selected</Text>
              <Text style={styles.selectedSummaryTitle}>{selectedCourse.courseName}</Text>
              <Text style={styles.selectedSummaryMeta}>
                Lecturer: {selectedCourse.lecturerUsername || selectedCourse.lecturerName || "Unknown"}
              </Text>
            </View>
          )}

          <SectionLabel text="Your Rating" />
          <View style={styles.starCard}>
            <StarPicker value={rating} onChange={setRating} />
          </View>

          <SectionLabel text="Comment (optional)" />
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Share your feedback…"
            placeholderTextColor={C.muted}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={submitRating}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {submitting ? "Submitting…" : "Submit Rating"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LECTURER VIEW ──
  if (role === "lecturer") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Feedback Overview</Text>
          <Text style={styles.headerTitle}>My Ratings</Text>
          <Text style={styles.headerSub}>Feedback from your students</Text>
        </View>

        <FlatList
          data={lecturerRatings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            average !== null
              ? <AverageBlock average={average} count={lecturerRatings.length} />
              : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <RatingCard item={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No ratings yet.</Text>}
        />
      </SafeAreaView>
    );
  }

  // ── PL / PRL / ADMIN VIEW ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>System Overview</Text>
        <Text style={styles.headerTitle}>All Ratings</Text>
        <Text style={styles.headerSub}>Complete feedback across all lecturers</Text>
      </View>

      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <RatingCard item={item} showLecturer />}
        ListEmptyComponent={<Text style={styles.emptyText}>No ratings found.</Text>}
      />
    </SafeAreaView>
  );
}

// ─── Styles (unchanged) ───────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: C.navy,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontSize: 11, fontWeight: "600", letterSpacing: 1.2,
    color: C.gold, textTransform: "uppercase", marginBottom: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.white, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: "rgba(255,255,255,0.5)" },

  content: { padding: 16, paddingBottom: 40 },

  label: {
    fontSize: 11, fontWeight: "600", letterSpacing: 1,
    color: C.muted, textTransform: "uppercase", marginTop: 20, marginBottom: 10,
  },

  courseCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center",
  },
  courseCardSelected: { borderColor: C.navy, borderLeftWidth: 3, borderLeftColor: C.gold },
  courseTitle:        { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 6 },
  courseMetaRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  codeBadge:          { backgroundColor: C.badge, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  codeBadgeText:      { fontSize: 10, fontWeight: "600", color: C.navy, letterSpacing: 0.5 },
  courseLecturer:     { fontSize: 12, color: C.muted },
  checkCircle:        { width: 22, height: 22, borderRadius: 11, backgroundColor: C.navy,
                        alignItems: "center", justifyContent: "center", marginLeft: 10 },
  checkMark:          { color: C.white, fontSize: 11, fontWeight: "700" },

  selectedSummary:      { backgroundColor: C.navy, borderRadius: 12, padding: 16, marginTop: 16 },
  selectedSummaryLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: C.gold,
                          textTransform: "uppercase", marginBottom: 4 },
  selectedSummaryTitle: { fontSize: 16, fontWeight: "700", color: C.white, marginBottom: 2 },
  selectedSummaryMeta:  { fontSize: 13, color: "rgba(255,255,255,0.6)" },

  starCard:   { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
                padding: 20, alignItems: "center", marginBottom: 4 },
  starRow:    { flexDirection: "row", gap: 8 },
  star:       { fontSize: 36, color: "#cfd6e4" },
  starActive: { color: C.gold },

  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, minHeight: 100, fontSize: 14, color: C.text,
  },

  submitBtn:  { backgroundColor: C.navy, padding: 16, borderRadius: 12, marginTop: 20, alignItems: "center" },
  submitText: { color: C.white, fontWeight: "700", fontSize: 14, letterSpacing: 0.4 },

  emptyText: { color: C.muted, marginTop: 10, marginBottom: 20, fontSize: 13 },

  ratingCard: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16 },
  ratingTop:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.badge,
                alignItems: "center", justifyContent: "center" },
  avatarText:      { fontSize: 13, fontWeight: "600", color: C.navy },
  studentName:     { fontSize: 14, fontWeight: "600", color: C.text },
  ratingMeta:      { fontSize: 12, color: C.muted, marginTop: 2 },
  ratingBadge:     { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8,
                     paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row",
                     alignItems: "baseline", gap: 3 },
  ratingBadgeNum:  { fontSize: 18, fontWeight: "700", color: C.navy },
  ratingBadgeStar: { fontSize: 11, color: C.gold },

  miniStarRow: { flexDirection: "row", gap: 3, marginBottom: 8 },
  miniStar:    { fontSize: 13 },
  miniStarLit: { color: C.gold },
  miniStarDim: { color: "#dde1ec" },

  comment:  { fontSize: 13, color: C.text, lineHeight: 20, marginBottom: 6 },
  dateText: { fontSize: 11, color: C.muted },

  avgBlock:   { backgroundColor: C.navy, borderRadius: 12, padding: 20,
                flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  avgScore:   { fontSize: 54, fontWeight: "700", color: C.white, lineHeight: 58 },
  avgStarRow: { flexDirection: "row", gap: 4 },
  avgStar:    { fontSize: 16 },
  avgStarLit: { color: C.gold },
  avgStarDim: { color: "rgba(255,255,255,0.2)" },
  avgCount:   { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 },
});