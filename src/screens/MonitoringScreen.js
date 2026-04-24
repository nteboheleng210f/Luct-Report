import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { auth, db } from "../firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

/* ─────────────────────────────────────────────
   COLORS  (same token set as RatingScreen)
───────────────────────────────────────────── */
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
  green:  "#16a34a",
  greenBg:"#dcfce7",
  red:    "#dc2626",
  redBg:  "#fee2e2",
  amber:  "#d97706",
  amberBg:"#fef3c7",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function pct(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

/* ─────────────────────────────────────────────
   STAT CARD  — centred value, no left metric
───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <View style={[styles.statCard, accent && { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
      {!!sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

/* ─────────────────────────────────────────────
   ATTENDANCE ROW  — one lecture
───────────────────────────────────────────── */
function AttendanceRow({ report, present }) {
  const color  = present ? C.green : C.red;
  const bgCol  = present ? C.greenBg : C.redBg;
  const label  = present ? "Present" : "Absent";

  return (
    <View style={styles.attRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.attTopic} numberOfLines={1}>{report.topic || report.courseName}</Text>
        <Text style={styles.attMeta}>
          {report.courseCode}  •  {fmtDate(report.date || report.createdAt)}
        </Text>
        {!!report.week && (
          <Text style={styles.attMeta}>Week {report.week}  •  {report.scheduledTime}</Text>
        )}
      </View>
      <View style={[styles.statusPill, { backgroundColor: bgCol }]}>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   REPORT ROW  — one lecture report (admin/prl)
───────────────────────────────────────────── */
function ReportRow({ item }) {
  const attPct = pct(
    Number(item.actualPresent || 0),
    Number(item.totalRegistered || 1)
  );
  const pillColor = attPct >= 75 ? C.green : attPct >= 50 ? C.amber : C.red;
  const pillBg    = attPct >= 75 ? C.greenBg : attPct >= 50 ? C.amberBg : C.redBg;

  return (
    <View style={styles.reportRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.attTopic} numberOfLines={1}>
          {item.topic || item.courseName}
        </Text>
        <Text style={styles.attMeta}>
          {item.lecturerName}  •  {item.courseCode}
        </Text>
        <Text style={styles.attMeta}>
          {fmtDate(item.date || item.createdAt)}
          {item.week ? `  •  Week ${item.week}` : ""}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
        <Text style={[styles.statusText, { color: pillColor }]}>{attPct}%</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

/* ─────────────────────────────────────────────
   HEADER BANNER
───────────────────────────────────────────── */
function Header({ eyebrow, title, sub }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
      {!!sub && <Text style={styles.headerSub}>{sub}</Text>}
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function MonitoringScreen() {
  const user = auth.currentUser;

  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe]           = useState(null);

  // Student
  const [myAttendance, setMyAttendance]   = useState([]);  // attendance docs for this student
  const [classReports, setClassReports]   = useState([]);  // lectureReports for this class

  // Lecturer
  const [myReports, setMyReports]         = useState([]);

  // PRL / PL
  const [allReports, setAllReports]       = useState([]);
  const [allUsers, setAllUsers]           = useState([]);

  /* ───────────────────────────────────────────
     LOAD DATA
  ─────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        // 1. All users (needed for role + PL/PRL views)
        const usersSnap = await getDocs(collection(db, "users"));
        const users     = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllUsers(users);

        const meDoc = users.find((u) => u.id === user.uid);
        setMe(meDoc);
        setRole(meDoc?.role || "student");

        // 2. All lecture reports
        const reportsSnap = await getDocs(collection(db, "lectureReports"));
        const reports     = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllReports(reports);

        if (meDoc?.role === "lecturer") {
          setMyReports(reports.filter((r) => r.lecturerId === user.uid));
        }

        if (meDoc?.role === "student" && meDoc?.classId) {
          // Lecture reports for this student's class
          const cr = reports.filter((r) => r.classId === meDoc.classId);
          setClassReports(cr);

          // Attendance records for THIS student specifically
          // attendance doc fields: studentId, courseId, classId, status, date, courseName
          const attQ   = query(
            collection(db, "attendance"),
            where("studentId", "==", user.uid)
          );
          const attSnap = await getDocs(attQ);
          const attDocs = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMyAttendance(attDocs);
        }

      } catch (e) {
        console.log("Monitoring error:", e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ───────────────────────────────────────────
     LOADING
  ─────────────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.navy} />
      </View>
    );
  }

  /* =========================================================
     STUDENT VIEW
     - Real attendance from `attendance` collection
     - One row per lecture report, showing Present / Absent
  ========================================================= */
  if (role === "student") {
    // For each lecture report in this class, check if student has an attendance doc
    const lecturesWithStatus = classReports.map((report) => {
      const attDoc = myAttendance.find(
        (a) =>
          // match by courseId OR by classId+date as fallback
          a.courseId === report.courseId ||
          (a.classId === report.classId &&
            (a.date === report.date ||
              a.date?.substring(0, 10) === report.date?.substring(0, 10)))
      );
      const present =
        attDoc?.status?.toLowerCase() === "present" ||
        attDoc?.status?.toLowerCase() === "attended";
      return { report, present, hasRecord: !!attDoc };
    });

    const totalLectures  = lecturesWithStatus.length;
    const attended       = lecturesWithStatus.filter((l) => l.present).length;
    const attendancePct  = pct(attended, totalLectures);
    const pillColor      = attendancePct >= 75 ? C.green : attendancePct >= 50 ? C.amber : C.red;

    return (
      <View style={styles.screen}>
        <Header
          eyebrow="Student Dashboard"
          title="My Monitoring"
          sub={user.displayName || me?.displayName || me?.name || ""}
        />

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stat row ── */}
          <View style={styles.statRow}>
            <StatCard
              label="Attendance"
              value={`${attendancePct}%`}
              sub={`${attended} / ${totalLectures} lectures`}
              accent={pillColor}
            />
            <StatCard
              label="Lectures"
              value={totalLectures}
              sub="covered in class"
              accent={C.navy}
            />
          </View>

          {/* ── Per-lecture attendance ── */}
          <SectionLabel text="Lecture Attendance" />

          {lecturesWithStatus.length === 0 ? (
            <Text style={styles.emptyText}>No lecture reports yet for your class.</Text>
          ) : (
            lecturesWithStatus.map(({ report, present, hasRecord }) => (
              <AttendanceRow
                key={report.id}
                report={report}
                present={present}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  /* =========================================================
     LECTURER VIEW
  ========================================================= */
  if (role === "lecturer") {
    const totalRegistered = myReports.reduce(
      (s, r) => s + Number(r.totalRegistered || 0), 0
    );
    const totalPresent = myReports.reduce(
      (s, r) => s + Number(r.actualPresent || 0), 0
    );
    const avgAtt = pct(totalPresent, totalRegistered);

    return (
      <View style={styles.screen}>
        <Header
          eyebrow="Lecturer Dashboard"
          title="My Monitoring"
          sub={user.displayName || me?.displayName || me?.name || "Lecturer"}
        />

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statRow}>
            <StatCard
              label="Reports"
              value={myReports.length}
              sub="submitted"
              accent={C.navy}
            />
            <StatCard
              label="Avg Attendance"
              value={`${avgAtt}%`}
              sub={`${totalPresent} / ${totalRegistered}`}
              accent={avgAtt >= 75 ? C.green : avgAtt >= 50 ? C.amber : C.red}
            />
          </View>

          <SectionLabel text="Report History" />

          {myReports.length === 0 ? (
            <Text style={styles.emptyText}>No reports submitted yet.</Text>
          ) : (
            myReports
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((r) => <ReportRow key={r.id} item={r} />)
          )}
        </ScrollView>
      </View>
    );
  }

  /* =========================================================
     PRL VIEW
  ========================================================= */
  if (role === "prl") {
    const pending  = allReports.filter((r) => !r.prlFeedback);
    const reviewed = allReports.filter((r) =>  r.prlFeedback);

    return (
      <View style={styles.screen}>
        <Header
          eyebrow="PRL Dashboard"
          title="Academic Monitoring"
          sub={user.displayName || me?.displayName || me?.name || "PRL"}
        />

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statRow}>
            <StatCard label="Total Reports" value={allReports.length} accent={C.navy} />
            <StatCard label="Pending"        value={pending.length}   accent={C.amber} />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Reviewed"       value={reviewed.length}  accent={C.green} />
          </View>

          <SectionLabel text="Pending Reports" />
          {pending.length === 0 ? (
            <Text style={styles.emptyText}>All reports have been reviewed.</Text>
          ) : (
            pending
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((r) => <ReportRow key={r.id} item={r} />)
          )}
        </ScrollView>
      </View>
    );
  }

  /* =========================================================
     PL / ADMIN VIEW
  ========================================================= */
  const lecturers = allUsers.filter((u) => u.role === "lecturer");
  const students  = allUsers.filter((u) => u.role === "student");
  const totalAtt  = pct(
    allReports.reduce((s, r) => s + Number(r.actualPresent   || 0), 0),
    allReports.reduce((s, r) => s + Number(r.totalRegistered || 0), 0)
  );

  return (
    <View style={styles.screen}>
      <Header
        eyebrow="PL Dashboard"
        title="System Monitoring"
        sub={user.displayName || me?.displayName || me?.name || "Programme Leader"}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statRow}>
          <StatCard label="Lecturers"       value={lecturers.length}   accent={C.navy} />
          <StatCard label="Students"        value={students.length}    accent={C.navy2} />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Total Reports"   value={allReports.length}  accent={C.navy} />
          <StatCard
            label="System Attendance"
            value={`${totalAtt}%`}
            accent={totalAtt >= 75 ? C.green : totalAtt >= 50 ? C.amber : C.red}
          />
        </View>

        <SectionLabel text="Recent Reports" />
        {allReports
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20)
          .map((r) => <ReportRow key={r.id} item={r} />)}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.navy,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: C.gold,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: C.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },

  body: { padding: 16, paddingBottom: 40 },

  // Stat cards
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
  },
  statSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
    textAlign: "center",
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: C.muted,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 10,
  },

  // Attendance row
  attRow: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  attTopic: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginBottom: 3,
  },
  attMeta: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 1,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 10,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Report row
  reportRow: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  emptyText: {
    color: C.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
});