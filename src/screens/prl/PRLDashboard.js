import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

const API_URL = "http://10.115.113.31:5000/api";

const C = {
  bg:       "#070b18",
  surface:  "#0f172a",
  surface2: "#1e293b",
  border:   "#1e293b",
  green:    "#4ade80",
  greenDim: "#166534",
  greenBg:  "#052e16",
  blue:     "#60a5fa",
  amber:    "#fbbf24",
  slate:    "#94a3b8",
  muted:    "#475569",
  white:    "#f1f5f9",
  red:      "#fca5a5",
  redDim:   "#7f1d1d",
  redBg:    "#1c0a0a",
};

// ─── helpers ──────────────────────────────────────────────
const apiFetch = async (path) => {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ─── sub-components ───────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <View style={sp.pill}>
      <Text style={[sp.val, { color }]}>{value ?? "—"}</Text>
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill:  { alignItems: "center", flex: 1 },
  val:   { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  label: { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 },
});

function SectionHeader({ label }) {
  return <Text style={sh.label}>{label}</Text>;
}
const sh = StyleSheet.create({
  label: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.1,
           textTransform: "uppercase", marginBottom: 10, marginTop: 6 },
});

function NavCard({ title, subtitle, accent, onPress }) {
  return (
    <TouchableOpacity style={[nc.card, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={0.7}>
      <View style={nc.body}>
        <Text style={nc.title}>{title}</Text>
        {subtitle ? <Text style={nc.sub}>{subtitle}</Text> : null}
      </View>
      <Text style={nc.arrow}>›</Text>
    </TouchableOpacity>
  );
}
const nc = StyleSheet.create({
  card:  { backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
           borderLeftWidth: 3, borderRadius: 14, paddingHorizontal: 14,
           paddingVertical: 14, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  body:  { flex: 1 },
  title: { color: C.white, fontSize: 15, fontWeight: "600" },
  sub:   { color: C.muted, fontSize: 12, marginTop: 3 },
  arrow: { color: C.surface2, fontSize: 22, marginLeft: 8 },
});

function ReportCard({ report }) {
  const hasFeedback = !!report.feedback;
  return (
    <View style={rc.card}>
      <View style={rc.row}>
        <View style={[rc.dot, { backgroundColor: hasFeedback ? C.green : C.amber }]} />
        <Text style={rc.name} numberOfLines={1}>
          {report.lecturerName || report.lecturerId || "Lecturer"}
        </Text>
        <Text style={rc.date}>
          {report.date ? new Date(report.date).toLocaleDateString() : "—"}
        </Text>
      </View>
      <Text style={rc.topic} numberOfLines={2}>{report.topic || report.title || "No topic"}</Text>
      {hasFeedback && (
        <View style={rc.feedbackBadge}>
          <Text style={rc.feedbackText}>Feedback added</Text>
        </View>
      )}
    </View>
  );
}
const rc = StyleSheet.create({
  card:         { backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
                  borderRadius: 12, padding: 14, marginBottom: 8 },
  row:          { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot:          { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  name:         { flex: 1, color: C.white, fontSize: 13, fontWeight: "600" },
  date:         { color: C.muted, fontSize: 11 },
  topic:        { color: C.slate, fontSize: 12, lineHeight: 18 },
  feedbackBadge:{ marginTop: 8, backgroundColor: C.greenBg, borderRadius: 6,
                  alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3 },
  feedbackText: { color: C.green, fontSize: 11, fontWeight: "600" },
});

function LecturerRow({ lecturer }) {
  const rating = lecturer.avgRating ? parseFloat(lecturer.avgRating) : null;
  const ratingColor = !rating ? C.muted : rating >= 4 ? C.green : rating >= 3 ? C.amber : C.red;

  return (
    <View style={lr.row}>
      <View style={lr.avatar}>
        <Text style={lr.avatarText}>
          {(lecturer.displayName || lecturer.name || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={lr.info}>
        <Text style={lr.name} numberOfLines={1}>{lecturer.displayName || lecturer.name || "Lecturer"}</Text>
        <Text style={lr.sub}>{lecturer.reportCount ?? 0} reports</Text>
      </View>
      <View style={lr.ratingBox}>
        <Text style={[lr.ratingVal, { color: ratingColor }]}>
          {rating ? rating.toFixed(1) : "—"}
        </Text>
        <Text style={lr.ratingLabel}>avg</Text>
      </View>
    </View>
  );
}
const lr = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", backgroundColor: C.surface,
                borderWidth: 0.5, borderColor: C.border, borderRadius: 12,
                padding: 12, marginBottom: 8 },
  avatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenBg,
                alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: C.green, fontSize: 14, fontWeight: "700" },
  info:       { flex: 1 },
  name:       { color: C.white, fontSize: 13, fontWeight: "600" },
  sub:        { color: C.muted, fontSize: 11, marginTop: 2 },
  ratingBox:  { alignItems: "center" },
  ratingVal:  { fontSize: 16, fontWeight: "700" },
  ratingLabel:{ fontSize: 10, color: C.muted, textTransform: "uppercase" },
});

// ─── main screen ──────────────────────────────────────────
export default function PRLDashboard({ navigation }) {
  const user = auth.currentUser;

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports]       = useState([]);
  const [courses, setCourses]       = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [error, setError]           = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [r, c, m] = await Promise.all([
        apiFetch("/prl/reports"),
        apiFetch("/prl/courses"),
        apiFetch("/prl/monitoring"),
      ]);
      setReports(r);
      setCourses(c);
      setMonitoring(m);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const logout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  // derived stats
  const recentReports    = reports.slice(0, 3);
  const pendingFeedback  = reports.filter(r => !r.feedback).length;
  const topLecturers     = [...monitoring]
    .sort((a, b) => (parseFloat(b.avgRating) || 0) - (parseFloat(a.avgRating) || 0))
    .slice(0, 3);

  const initials = (user?.displayName || "PRL")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.headerInfo}>
              <Text style={s.eyebrow}>Principal Lecturer</Text>
              <Text style={s.headerName}>{user?.displayName || "Dashboard"}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>Supervisor</Text>
            </View>
          </View>

          {/* stat strip */}
          <View style={s.statStrip}>
            <StatPill label="Courses"  value={courses.length}   color={C.blue}  />
            <View style={s.statDiv} />
            <StatPill label="Reports"  value={reports.length}   color={C.green} />
            <View style={s.statDiv} />
            <StatPill label="Pending"  value={pendingFeedback}  color={C.amber} />
            <View style={s.statDiv} />
            <StatPill label="Lecturers" value={monitoring.length} color={C.slate} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.green} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠ {error}</Text>
            <TouchableOpacity onPress={fetchAll} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.body}>

            {/* ── NAVIGATION ── */}
            <SectionHeader label="Modules" />
            <NavCard
              title="Reports"
              subtitle={`${pendingFeedback} awaiting feedback`}
              accent={C.green}
              onPress={() => navigation.navigate("PRLReports")}
            />
            <NavCard
              title="Courses"
              subtitle={`${courses.length} active courses`}
              accent={C.blue}
              onPress={() => navigation.navigate("Courses")}
            />
            <NavCard
              title="Ratings"
              subtitle="View student ratings"
              accent={C.amber}
              onPress={() => navigation.navigate("Ratings")}
            />
            <NavCard
              title="Monitoring"
              subtitle={`${monitoring.length} lecturers tracked`}
              accent={C.muted}
              onPress={() => navigation.navigate("Monitoring")}
            />

            {/* ── RECENT REPORTS ── */}
            {recentReports.length > 0 && (
              <>
                <SectionHeader label="Recent Reports" />
                {recentReports.map(r => <ReportCard key={r.id} report={r} />)}
                <TouchableOpacity
                  style={s.seeAll}
                  onPress={() => navigation.navigate("PRLReports")}
                >
                  <Text style={s.seeAllText}>See all reports ›</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── TOP LECTURERS ── */}
            {topLecturers.length > 0 && (
              <>
                <SectionHeader label="Top Rated Lecturers" />
                {topLecturers.map(l => <LecturerRow key={l.id} lecturer={l} />)}
                <TouchableOpacity
                  style={s.seeAll}
                  onPress={() => navigation.navigate("Monitoring")}
                >
                  <Text style={s.seeAllText}>View all lecturers ›</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── LOGOUT ── */}
            <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
              <Text style={s.logoutText}>Sign Out</Text>
              <Text style={s.logoutArrow}>›</Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // header
  header: {
    backgroundColor: C.surface,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 0.5,
    borderColor: C.border,
    marginBottom: 8,
  },
  headerRow:  { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: C.greenBg,
                alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: C.green, fontSize: 14, fontWeight: "700" },
  headerInfo: { flex: 1 },
  eyebrow:    { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8,
                textTransform: "uppercase" },
  headerName: { color: C.white, fontSize: 17, fontWeight: "700", marginTop: 2 },
  badge:      { backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenDim,
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { color: C.green, fontSize: 11, fontWeight: "600" },

  // stat strip
  statStrip: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: C.border,
               paddingVertical: 16 },
  statDiv:   { width: 0.5, backgroundColor: C.border, marginVertical: 4 },

  // body
  body: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 },

  // see all
  seeAll:     { alignItems: "flex-end", marginBottom: 16, marginTop: -2 },
  seeAllText: { color: C.green, fontSize: 12, fontWeight: "600" },

  // error
  errorBox:  { margin: 24, alignItems: "center" },
  errorText: { color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 },
  retryBtn:  { backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 20,
               paddingVertical: 10, borderWidth: 0.5, borderColor: C.border },
  retryText: { color: C.white, fontSize: 13, fontWeight: "600" },

  // logout
  logoutBtn:   { backgroundColor: C.redBg, borderWidth: 0.5, borderColor: C.redDim,
                 borderRadius: 14, padding: 16, marginTop: 16, flexDirection: "row",
                 justifyContent: "space-between", alignItems: "center" },
  logoutText:  { fontSize: 14, fontWeight: "600", color: C.red },
  logoutArrow: { fontSize: 22, color: C.redDim },
});