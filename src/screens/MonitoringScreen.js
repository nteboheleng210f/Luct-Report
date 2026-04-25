import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = "https://luct-reports-kggq.onrender.com/api";

const C = {
  bg:        "#070b18",
  card:      "#0f172a",
  card2:     "#111827",
  border:    "#1e293b",
  text:      "#f1f5f9",
  muted:     "#475569",
  muted2:    "#64748b",
  blue:      "#2563eb",
  blueSoft:  "#0c2240",
  blueText:  "#93c5fd",
  green:     "#16a34a",
  greenSoft: "#052e16",
  greenText: "#4ade80",
  red:       "#dc2626",
  redSoft:   "#450a0a",
  redText:   "#fca5a5",
  amber:     "#d97706",
  amberSoft: "#451a03",
  amberText: "#fcd34d",
};

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function pct(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

function attColor(p) {
  if (p >= 75) return { bg: C.greenSoft, text: C.greenText, border: C.green };
  if (p >= 50) return { bg: C.amberSoft, text: C.amberText, border: C.amber };
  return               { bg: C.redSoft,  text: C.redText,   border: C.red   };
}

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function SummaryBar({ items }) {
  return (
    <View style={styles.summaryBar}>
      {items.map((item, i) => (
        <View key={i} style={[styles.summaryItem, i < items.length - 1 && styles.summaryItemBorder]}>
          <Text style={[styles.summaryValue, { color: item.color || C.blueText }]}>{item.value}</Text>
          <Text style={styles.summaryLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function PageHeader({ title, sub }) {
  return (
    <View style={styles.pageHeader}>
      <View>
        <Text style={styles.pageTitle}>{title}</Text>
        {!!sub && <Text style={styles.pageSub}>{sub}</Text>}
      </View>
      <View style={styles.pageIconBox} />
    </View>
  );
}

// ── Student: one row per lecture showing present/absent ──
function StudentLectureRow({ report, present }) {
  const col = present
    ? { bg: C.greenSoft, text: C.greenText, border: C.green }
    : { bg: C.redSoft,   text: C.redText,   border: C.red   };

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {report.topic || report.courseName || "Lecture"}
        </Text>
        <Text style={styles.rowMeta}>
          {[report.courseCode, report.className].filter(Boolean).join("  ·  ")}
        </Text>
        <Text style={styles.rowMeta}>
          {[fmtDate(report.date || report.createdAt), report.week ? `Week ${report.week}` : ""].filter(Boolean).join("  ·  ")}
        </Text>
        {!!report.lecturerName && (
          <Text style={styles.rowMeta}>👤 {report.lecturerName}</Text>
        )}
      </View>
      <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
        <Text style={[styles.pillText, { color: col.text }]}>
          {present ? "✓ Present" : "✗ Absent"}
        </Text>
      </View>
    </View>
  );
}

// ── Lecturer: one row per report they submitted ──
function MyReportRow({ item }) {
  const p   = pct(Number(item.actualPresent || 0), Number(item.totalRegistered || 1));
  const col = attColor(p);
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.topic || item.courseName || "Report"}
        </Text>
        <Text style={styles.rowMeta}>
          {[item.courseCode, item.className].filter(Boolean).join("  ·  ")}
        </Text>
        <Text style={styles.rowMeta}>
          {[fmtDate(item.date || item.createdAt), item.week ? `Week ${item.week}` : ""].filter(Boolean).join("  ·  ")}
        </Text>
        <View style={styles.inlineStats}>
          <View style={styles.inlineStat}>
            <Text style={[styles.inlineStatVal, { color: C.greenText }]}>{item.actualPresent ?? 0}</Text>
            <Text style={styles.inlineStatLabel}>present</Text>
          </View>
          <View style={styles.inlineStat}>
            <Text style={[styles.inlineStatVal, { color: C.redText }]}>
              {Number(item.totalRegistered || 0) - Number(item.actualPresent || 0)}
            </Text>
            <Text style={styles.inlineStatLabel}>absent</Text>
          </View>
          <View style={styles.inlineStat}>
            <Text style={[styles.inlineStatVal, { color: C.blueText }]}>{item.totalRegistered ?? 0}</Text>
            <Text style={styles.inlineStatLabel}>total</Text>
          </View>
        </View>
      </View>
      <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
        <Text style={[styles.pillText, { color: col.text }]}>{p}%</Text>
      </View>
    </View>
  );
}

// ── PRL/PL: one row per report across all lecturers ──
function ReportRow({ item }) {
  const p   = pct(Number(item.actualPresent || 0), Number(item.totalRegistered || 1));
  const col = attColor(p);
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.topic || item.courseName || "Report"}
        </Text>
        <Text style={styles.rowMeta}>
          {[item.lecturerName, item.courseCode].filter(Boolean).join("  ·  ")}
        </Text>
        <Text style={styles.rowMeta}>
          {[fmtDate(item.date || item.createdAt), item.week ? `Week ${item.week}` : ""].filter(Boolean).join("  ·  ")}
        </Text>
        <Text style={styles.rowMeta}>
          {item.actualPresent ?? "—"} present  /  {item.totalRegistered ?? "—"} registered
        </Text>
      </View>
      <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
        <Text style={[styles.pillText, { color: col.text }]}>{p}%</Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════ */
export default function MonitoringScreen() {
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState(null);

  const [role,         setRole]         = useState(null);
  const [me,           setMe]           = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [classReports, setClassReports] = useState([]);
  const [myReports,    setMyReports]    = useState([]);
  const [allReports,   setAllReports]   = useState([]);
  const [allUsers,     setAllUsers]     = useState([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async (uid) => {
        try {
          setFetching(true);
          setError(null);

          const res = await fetch(`${API_URL}/monitoring/${uid}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (!isActive) return;

          setRole(data.role);
          setMe(data.me);
          setAllUsers(data.allUsers       || []);
          setAllReports(data.allReports   || []);
          setMyAttendance(data.myAttendance || []);
          setClassReports(data.classReports || []);
          setMyReports(data.myReports       || []);
        } catch (e) {
          if (isActive) setError(e.message);
        } finally {
          if (isActive) setFetching(false);
        }
      };

      // Try currentUser first, fall back to onAuthStateChanged
      if (auth.currentUser) {
        load(auth.currentUser.uid);
      } else {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub();
          if (user) load(user.uid);
          else setFetching(false);
        });
      }

      return () => { isActive = false; };
    }, [])
  );

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠ {error}</Text>
      </View>
    );
  }

  const displayName = me?.username || me?.displayName || me?.name || "";

  /* ══ STUDENT VIEW ══
     Only shows: their own attendance per lecture, overall %, warning if low
  */
  if (role === "student") {
    // Match each class report against the student's attendance records
    // Support multiple matching strategies so nothing is missed
    const lectureRows = classReports.map((report) => {
      const match = myAttendance.find((a) => {
        // Strategy 1: matched by reportId stored on attendance doc
        if (a.reportId && a.reportId === report.id) return true;
        // Strategy 2: same courseId + same date (date-only prefix)
        if (
          a.courseId === report.courseId &&
          a.date?.substring(0, 10) === (report.date || report.createdAt)?.substring(0, 10)
        ) return true;
        // Strategy 3: same classId + same date
        if (
          a.classId === report.classId &&
          a.date?.substring(0, 10) === (report.date || report.createdAt)?.substring(0, 10)
        ) return true;
        return false;
      });

      const present =
        match?.status?.toLowerCase() === "present" ||
        match?.status?.toLowerCase() === "attended";

      return { report, present, hasRecord: !!match };
    });

    const total    = lectureRows.length;
    const attended = lectureRows.filter((l) => l.present).length;
    const absent   = total - attended;
    const attPct   = pct(attended, total);
    const col      = attColor(attPct);

    // How many more lectures needed to reach 75%
    const lecturesNeeded = attPct < 75
      ? Math.max(0, Math.ceil((0.75 * total - attended) / 0.25))
      : 0;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PageHeader title="My Attendance" sub={displayName} />

        {/* ── Overview card ── */}
        <View style={[styles.summaryCard, { borderLeftColor: col.border, borderLeftWidth: 3 }]}>
          <View style={styles.summaryCardTop}>
            <Text style={styles.summaryCardTitle}>Attendance Overview</Text>
            <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
              <Text style={[styles.pillText, { color: col.text }]}>{attPct}%</Text>
            </View>
          </View>
          <SummaryBar items={[
            { label: "Lectures", value: total,    color: C.blueText  },
            { label: "Present",  value: attended, color: C.greenText },
            { label: "Absent",   value: absent,   color: C.redText   },
          ]} />

          {/* Warning if below 75% */}
          {attPct < 75 && total > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠ Below Minimum Attendance</Text>
              <Text style={styles.warningText}>
                You need to attend {lecturesNeeded} more lecture{lecturesNeeded !== 1 ? "s" : ""} to reach the 75% threshold.
              </Text>
            </View>
          )}

          {/* All good */}
          {attPct >= 75 && total > 0 && (
            <View style={styles.goodBox}>
              <Text style={styles.goodText}>✓ Attendance is on track</Text>
            </View>
          )}

          {/* No data yet */}
          {total === 0 && (
            <Text style={styles.emptyText}>No lectures recorded for your class yet.</Text>
          )}
        </View>

        {/* ── Per-lecture breakdown ── */}
        {lectureRows.length > 0 && (
          <>
            <SectionLabel text="LECTURE BREAKDOWN" />
            {lectureRows
              .slice()
              .sort((a, b) =>
                new Date(b.report.date || b.report.createdAt) -
                new Date(a.report.date || a.report.createdAt)
              )
              .map(({ report, present }) => (
                <StudentLectureRow key={report.id} report={report} present={present} />
              ))
            }
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  /* ══ LECTURER VIEW ══
     Only shows: their own submitted reports + aggregate stats
  */
  if (role === "lecturer") {
    const totalRegistered = myReports.reduce((s, r) => s + Number(r.totalRegistered || 0), 0);
    const totalPresent    = myReports.reduce((s, r) => s + Number(r.actualPresent    || 0), 0);
    const totalAbsent     = totalRegistered - totalPresent;
    const avgAtt          = pct(totalPresent, totalRegistered);
    const col             = attColor(avgAtt);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PageHeader title="My Reports" sub={displayName} />

        <View style={[styles.summaryCard, { borderLeftColor: col.border, borderLeftWidth: 3 }]}>
          <View style={styles.summaryCardTop}>
            <Text style={styles.summaryCardTitle}>Attendance Overview</Text>
            <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
              <Text style={[styles.pillText, { color: col.text }]}>{avgAtt}%</Text>
            </View>
          </View>
          <SummaryBar items={[
            { label: "Reports",    value: myReports.length, color: C.blueText  },
            { label: "Present",    value: totalPresent,     color: C.greenText },
            { label: "Absent",     value: totalAbsent,      color: C.redText   },
            { label: "Registered", value: totalRegistered,  color: C.muted2    },
          ]} />
        </View>

        <SectionLabel text="REPORT HISTORY" />
        {myReports.length === 0 ? (
          <Text style={styles.emptyText}>No reports submitted yet.</Text>
        ) : (
          myReports
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((r) => <MyReportRow key={r.id} item={r} />)
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  /* ══ PRL VIEW ══
     Overview of all reports — pending vs reviewed
  */
  if (role === "prl") {
    const pending  = allReports.filter((r) => !r.prlFeedback);
    const reviewed = allReports.filter((r) =>  r.prlFeedback);
    const totalReg = allReports.reduce((s, r) => s + Number(r.totalRegistered || 0), 0);
    const totalPre = allReports.reduce((s, r) => s + Number(r.actualPresent    || 0), 0);
    const sysAtt   = pct(totalPre, totalReg);
    const col      = attColor(sysAtt);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PageHeader title="Academic Monitoring" sub={displayName} />

        <View style={[styles.summaryCard, { borderLeftColor: col.border, borderLeftWidth: 3 }]}>
          <View style={styles.summaryCardTop}>
            <Text style={styles.summaryCardTitle}>System Overview</Text>
            <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
              <Text style={[styles.pillText, { color: col.text }]}>{sysAtt}% avg</Text>
            </View>
          </View>
          <SummaryBar items={[
            { label: "Reports",  value: allReports.length, color: C.blueText  },
            { label: "Pending",  value: pending.length,    color: C.amberText },
            { label: "Reviewed", value: reviewed.length,   color: C.greenText },
          ]} />
        </View>

        <SectionLabel text="PENDING REPORTS" />
        {pending.length === 0 ? (
          <Text style={styles.emptyText}>All reports reviewed ✓</Text>
        ) : (
          pending
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((r) => <ReportRow key={r.id} item={r} />)
        )}

        {reviewed.length > 0 && (
          <>
            <SectionLabel text="REVIEWED REPORTS" />
            {reviewed
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((r) => <ReportRow key={r.id} item={r} />)
            }
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  /* ══ PL / ADMIN VIEW ══ */
  const lecturers = allUsers.filter((u) => u.role === "lecturer");
  const students  = allUsers.filter((u) => u.role === "student");
  const totalReg  = allReports.reduce((s, r) => s + Number(r.totalRegistered || 0), 0);
  const totalPre  = allReports.reduce((s, r) => s + Number(r.actualPresent    || 0), 0);
  const sysAtt    = pct(totalPre, totalReg);
  const col       = attColor(sysAtt);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader title="System Monitoring" sub={displayName} />

      <View style={[styles.summaryCard, { borderLeftColor: col.border, borderLeftWidth: 3 }]}>
        <View style={styles.summaryCardTop}>
          <Text style={styles.summaryCardTitle}>System Overview</Text>
          <View style={[styles.pill, { backgroundColor: col.bg, borderWidth: 0.5, borderColor: col.border }]}>
            <Text style={[styles.pillText, { color: col.text }]}>{sysAtt}% avg</Text>
          </View>
        </View>
        <SummaryBar items={[
          { label: "Lecturers", value: lecturers.length,  color: C.blueText  },
          { label: "Students",  value: students.length,   color: C.blueText  },
          { label: "Reports",   value: allReports.length, color: C.muted2    },
          { label: "Present",   value: totalPre,          color: C.greenText },
        ]} />
      </View>

      <SectionLabel text="RECENT REPORTS" />
      {allReports.length === 0 ? (
        <Text style={styles.emptyText}>No reports yet.</Text>
      ) : (
        allReports
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20)
          .map((r) => <ReportRow key={r.id} item={r} />)
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg, padding: 16 },
  center:      { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: C.muted, fontSize: 14 },
  errorText:   { color: C.redText, fontSize: 13, textAlign: "center", paddingHorizontal: 24 },

  pageHeader: {
    backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border,
    borderRadius: 14, padding: 16, marginBottom: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  pageTitle:   { color: C.text,  fontSize: 17, fontWeight: "700" },
  pageSub:     { color: C.muted, fontSize: 12, marginTop: 2 },
  pageIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.blue },

  summaryCard: {
    backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  summaryCardTop: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  summaryCardTitle: { color: C.text, fontSize: 13, fontWeight: "600" },

  summaryBar: {
    flexDirection: "row", backgroundColor: C.card2,
    borderRadius: 10, borderWidth: 0.5, borderColor: C.border, overflow: "hidden",
  },
  summaryItem:       { flex: 1, alignItems: "center", paddingVertical: 12 },
  summaryItemBorder: { borderRightWidth: 0.5, borderRightColor: C.border },
  summaryValue:      { fontSize: 20, fontWeight: "700", color: C.blueText },
  summaryLabel:      { fontSize: 10, color: C.muted, marginTop: 2, fontWeight: "500", letterSpacing: 0.4 },

  warningBox: {
    backgroundColor: C.amberSoft, borderRadius: 8, padding: 10,
    marginTop: 12, borderWidth: 0.5, borderColor: C.amber,
  },
  warningTitle: { color: C.amberText, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  warningText:  { color: C.amberText, fontSize: 11, lineHeight: 16 },

  goodBox: {
    backgroundColor: C.greenSoft, borderRadius: 8, padding: 10,
    marginTop: 12, borderWidth: 0.5, borderColor: C.green,
  },
  goodText: { color: C.greenText, fontSize: 12, fontWeight: "600" },

  sectionLabel: {
    fontSize: 11, fontWeight: "600", color: C.muted,
    letterSpacing: 0.8, marginBottom: 10, marginTop: 8,
  },

  row: {
    backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border,
    borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", marginBottom: 8,
  },
  rowLeft:  { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 3 },
  rowMeta:  { fontSize: 11, color: C.muted, marginBottom: 2 },

  inlineStats:     { flexDirection: "row", gap: 12, marginTop: 6 },
  inlineStat:      { alignItems: "center" },
  inlineStatVal:   { fontSize: 14, fontWeight: "700" },
  inlineStatLabel: { fontSize: 10, color: C.muted, marginTop: 1 },

  pill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10, flexShrink: 0 },
  pillText: { fontSize: 12, fontWeight: "700" },

  emptyText: { color: C.muted, fontSize: 13, textAlign: "center", marginTop: 16, marginBottom: 8 },
});