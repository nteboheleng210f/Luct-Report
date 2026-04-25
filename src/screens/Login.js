import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";


const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={[styles.fieldInput, focused && styles.fieldFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#c4c9d4"
        secureTextEntry={secure}
        autoCapitalize="none"
        keyboardType={keyboardType || "default"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim() || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://10.11.17.47:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      // ⚠️ SAFE PARSING (prevents crash if backend returns HTML)
      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      console.log("TOKEN:", data.token);

      const role = data.user.role;

      if (role === "student") {
        navigation.replace("StudentDashboard");
      } else if (role === "lecturer") {
        navigation.replace("LecturerDashboard");
      } else if (role === "prl") {
        navigation.replace("PRLDashboard");
      } else if (role === "pl") {
        navigation.replace("PLDashboard");
      } else {
        alert("Unknown role: " + role);
      }

    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0c1a3a" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formPanel}>
          <Text style={styles.portalLabel}>LOGIN PORTAL</Text>

          <Text style={styles.formTitle}>Sign in to LUCT</Text>
          <Text style={styles.formSub}>Enter your credentials</Text>

          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secure
          />

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.7 }]}
            onPress={login}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>New to LUCT?</Text>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────
// STYLES (unchanged design)
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c1a3a" },
  scroll: { flexGrow: 1 },

  formPanel: {
    flex: 1,
    backgroundColor: "#f7f9fc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 32,
  },

  portalLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#9aa0b4",
    marginBottom: 8,
  },

  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  formSub: {
    fontSize: 13,
    color: "#9aa0b4",
    marginBottom: 26,
  },

  fieldWrap: { marginBottom: 14 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 6,
  },

  fieldInput: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },

  fieldFocused: {
    borderColor: "#5b6ef5",
    borderWidth: 1,
  },

  signInBtn: {
    backgroundColor: "#5b6ef5",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 22,
  },

  signInText: {
    color: "#fff",
    fontWeight: "700",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  divLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#e5e7eb",
  },

  divText: {
    fontSize: 11,
    color: "#c4c9d4",
    marginHorizontal: 10,
  },

  registerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#9aa0b4",
  },

  registerLink: {
    color: "#5b6ef5",
    fontWeight: "700",
  },
});