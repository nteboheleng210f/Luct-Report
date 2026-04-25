import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.115.113.31:5000/api";

const NavItem = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.navItem, active && styles.navItemActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({ value, label, sub, color }) => (
  <View style={[styles.statCard, { backgroundColor: color }]}>
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);


const ActionCard = ({ label, onPress }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Upcoming Class Card ──
const UpcomingClassCard = ({ classData, loading }) => {
  if (loading) {
    return (
      <View style={styles.upcomingCard}>
        <ActivityIndicator size="small" color="#4f7cde" />
        <Text style={styles.upcomingLoading}>Loading next class...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.upcomingCard}>
        <Text style={styles.upcomingEmpty}>No upcoming classes today</Text>
      </View>
    );
  }

  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingLeft}>
        <Text style={styles.upcomingCourse}>
          {classData.courseName} ({classData.courseCode})
        </Text>
        <Text style={styles.upcomingCode}>
          {classData.day}  •  {classData.time}
        </Text>
        <Text style={styles.upcomingVenue}>{classData.venue}</Text>
      </View>
    </View>
  );
};

// ── Main Screen ──
export default function StudentDashboard({ navigation }) {
  const [user, setUser] = useState(null);

  const [loading,      setLoading]      = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(true);
  const [activeNav,    setActiveNav]    = useState("Dashboard");

  const [attendancePercent, setAttendancePercent] = useState(0);
  const [ratingsCount,      setRatingsCount]      = useState(0);
  const [upcomingClass,     setUpcomingClass]     = useState(null);

  const navItems = [
    { label: "Dashboard"  },
    { label: "Attendance" },
    { label: "Ratings"    },
    { label: "Monitoring" },
  ];

  const handleNav = (label) => {
    setActiveNav(label);
    if (label !== "Dashboard") {
      navigation.navigate(label);
    }
  };

  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {
        console.log("Load user error:", e.message);
      }
    };
    loadUser();
  }, []);


  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res   = await fetch(`${API_URL}/student/stats/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAttendancePercent(data.attendancePercent || 0);
        setRatingsCount(data.ratingsCount || 0);
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // ── Fetch upcoming class ──
  useEffect(() => {
    if (!user) return;
    const fetchUpcomingClass = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res   = await fetch(`${API_URL}/student/upcoming/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUpcomingClass(data?.[0] || null);
      } catch (err) {
        console.log("Upcoming class error:", err);
        setUpcomingClass(null);
      } finally {
        setClassLoading(false);
      }
    };
    fetchUpcomingClass();
  }, [user]);

 
  const logout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.layout}>

      
        <View style={styles.sidebar}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>IS</Text>
            </View>
          </View>

          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              active={activeNav === item.label}
              onPress={() => handleNav(item.label)}
            />
          ))}
        </View>

       
        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.pageTitle}>Your Dashboard</Text>
            </View>
            <View style={styles.userPill}>
              <View style={styles.pillAvatar}>
                <Text style={styles.pillAvatarText}>
                  {user?.email?.[0]?.toUpperCase() || "S"}
                </Text>
              </View>
              <Text style={styles.pillLabel}>Student</Text>
            </View>
          </View>

          {/* Stat cards */}
          <View style={styles.statRow}>
            <StatCard
              value={statsLoading ? "" : `${attendancePercent}%`}
              label="Attendance"
              sub="Present this term"
              color="#4f7cde"
            />
            <StatCard
              value={statsLoading ? "" : ratingsCount}
              label="Ratings Given"
              sub="Lecturer reviews"
              color="#2daa70"
            />
          </View>

          {/* Upcoming class */}
          <Text style={styles.sectionTitle}>Upcoming Class</Text>
          <UpcomingClassCard classData={upcomingClass} loading={classLoading} />

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionCard label="Attendance" onPress={() => navigation.navigate("Attendance")} />
            <ActionCard label="Ratings"    onPress={() => navigation.navigate("Ratings")}    />
            <ActionCard label="Monitoring" onPress={() => navigation.navigate("Monitoring")} />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, loading && { opacity: 0.6 }]}
            onPress={logout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>
              {loading ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#1a2236" },
  layout: { flex: 1, flexDirection: "row" },

 
  sidebar: {
    width: 72,
    backgroundColor: "#1a2236",
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    borderRightWidth: 0.5,
    borderRightColor: "rgba(255,255,255,0.06)",
  },
  logoWrap: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    width: "100%",
    alignItems: "center",
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4f7cde",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  navItem: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: "rgba(79,124,222,0.18)",
  },
  navLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  navLabelActive: { color: "#ffffff", fontWeight: "600" },

  main:        { flex: 1, backgroundColor: "#f1f5f9" },
  mainContent: { padding: 16, paddingBottom: 32, gap: 14 },


  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  greeting:  { fontSize: 13, color: "#64748b", marginBottom: 2 },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },

  userPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#4f7cde",
    alignItems: "center",
    justifyContent: "center",
  },
  pillAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pillLabel:      { fontSize: 12, color: "#64748b" },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 14 },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#ffffff" },
  statLabel:  { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  statSub:    { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 3 },

 
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -4,
  },


  upcomingCard: {
    backgroundColor: "#1a2236",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 80,
    gap: 10,
  },
  upcomingLeft:    { flex: 1 },
  upcomingCourse:  { fontSize: 15, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
  upcomingCode:    { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 2 },
  upcomingVenue:   { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  upcomingEmpty:   { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", flex: 1 },
  upcomingLoading: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 10 },

  actionGrid: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#0f172a", textAlign: "center" },

  logoutBtn: {
    backgroundColor:"red",
    
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  logoutText: { color: "#f1e7e7", fontWeight: "700", fontSize: 14 },
});