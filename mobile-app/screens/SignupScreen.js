import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../utils/supabase";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={["left"]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#334155"]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="mail" size={64} color="#60a5fa" />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successSubtitle}>
                We've sent a verification link to
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              <Text style={styles.instructionText}>
                Please check your email and click the verification link to
                complete your account setup
              </Text>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#334155"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.heroContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={64} color="#60a5fa" />
            </View>
            <Text style={styles.appTitle}>WeatherCast</Text>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitleText}>
              Join thousands tracking weather worldwide
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              importantForAutofill="yes"
              returnKeyType="next"
              enablesReturnKeyAutomatically={true}
              style={styles.input}
              theme={{
                colors: {
                  primary: "#60a5fa",
                  onSurface: "#f8fafc",
                  surface: "rgba(30,41,59,0.95)",
                  onSurfaceVariant: "#94a3b8",
                  outline: "rgba(59,130,246,0.3)",
                },
              }}
              mode="outlined"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              importantForAutofill="yes"
              returnKeyType="next"
              enablesReturnKeyAutomatically={true}
              passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;"
              style={styles.input}
              theme={{
                colors: {
                  primary: "#60a5fa",
                  onSurface: "#f8fafc",
                  surface: "rgba(30,41,59,0.95)",
                  onSurfaceVariant: "#94a3b8",
                  outline: "rgba(59,130,246,0.3)",
                },
              }}
              mode="outlined"
            />
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              importantForAutofill="yes"
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              style={styles.input}
              theme={{
                colors: {
                  primary: "#60a5fa",
                  onSurface: "#f8fafc",
                  surface: "rgba(30,41,59,0.95)",
                  onSurfaceVariant: "#94a3b8",
                  outline: "rgba(59,130,246,0.3)",
                },
              }}
              mode="outlined"
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
              labelStyle={styles.signupButtonLabel}
              buttonColor="#3b82f6"
            >
              Create Account
            </Button>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginTextAccent}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  heroContainer: {
    alignItems: "center",
    marginBottom: 32,
    backgroundColor: "rgba(15, 23, 42, 0)",
    padding: 40,
    backdropFilter: "blur(40px)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 25,
  },
  iconContainer: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 50,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  appTitle: {
    fontSize: 36,
    color: "#ffffff",
    fontWeight: "100",
    marginBottom: 8,
    letterSpacing: -1,
  },
  welcomeText: {
    fontSize: 24,
    color: "#f8fafc",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 14,
    color: "#60a5fa",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "rgba(30,41,59,0.95)",
    borderRadius: 28,
    padding: 32,
    backdropFilter: "blur(25px)",
    borderWidth: 2,
    borderColor: "rgba(59,130,246,0.25)",
    elevation: 25,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "rgba(30,41,59,0.95)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  signupButton: {
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  loginButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "400",
  },
  loginTextAccent: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 32,
    padding: 48,
    backdropFilter: "blur(40px)",
    borderWidth: 2,
    borderColor: "rgba(59,130,246,0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 25,
  },
  successIconContainer: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 50,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  successTitle: {
    fontSize: 28,
    color: "#f8fafc",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 17,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: "400",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  emailText: {
    fontSize: 18,
    color: "#60a5fa",
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#60a5fa",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  backButtonText: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
