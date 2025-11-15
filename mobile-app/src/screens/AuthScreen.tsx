import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { auth } from "../lib/auth";

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const success = await auth.login(password);
      if (success) {
        onAuthenticated();
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appTitle}>MINMAX</Text>
        <Text style={styles.subtitle}>Track your workouts</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Enter Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.button,
              (!password || loading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading || !password}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 32,
    textAlign: "center",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#374151",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
