import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const API_URL = "https://luct-reports-kggq.onrender.com/api";

export default function LecturerDashboard({ navigation }) {
  const user = auth.currentUser;

  const [stats, setStats] = useState({
    courses: 0,
    classes: 0,
    reports: 0,
    ratings: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/lecturer/stats/${user.uid}`
      );

      const data = await res.json();

      setStats({
        courses: data.courses || 0,
        classes: data.classes || 0,
        reports: data.reports || 0,
        ratings: data.ratings || 0,
      });

    } catch (error) {
      console.log("Dashboard error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const logout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  const NavCard = ({ title, subtitle, route, accent }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={() => navigation.navigate(route)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const StatBox = ({ label, value }) => (
    <View style={styles.statBox}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lecturer Dashboard</Text>
        <Text style={styles.headerSub}>{user?.email}</Text>

        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatBox label="Courses" value={stats.courses} />
            <StatBox label="Classes" value={stats.classes} />
            <StatBox label="Reports" value={stats.reports} />
            <StatBox label="Ratings" value={stats.ratings} />
          </View>
        )}
      </View>

      {/* NAV */}
      <View style={styles.body}>
        <NavCard
          title="My Classes"
          subtitle="View assigned classes"
          route="Classes"
          accent="#3b82f6"
        />

        <NavCard
          title="Reports"
          subtitle="Submit lecture reports"
          route="LectureReportForm"
          accent="#22c55e"
        />

        <NavCard
          title="Attendance"
          subtitle="Mark student attendance"
          route="Attendance"
          accent="#f59e0b"
        />

        <NavCard
          title="Ratings"
          subtitle="View student feedback"
          route="Ratings"
          accent="#a855f7"
        />

        <NavCard
          title="Monitoring"
          subtitle="Performance tracking"
          route="Monitoring"
          accent="#64748b"
        />

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={{ color: "#ef4444", fontWeight: "700" }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

  header: {
    backgroundColor: "#111827",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  headerSub: {
    color: "#94a3b8",
    marginTop: 5,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#1f2937",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  statNum: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
  },

  body: {
    padding: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },

  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  sub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: "#64748b",
    fontSize: 20,
  },

  logout: {
    marginTop: 20,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 10,
  },
});