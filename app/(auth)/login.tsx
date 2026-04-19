import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.replace("/(app)/dashboard");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#faf7f2" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          {/* Logo */}
          <Text
            style={{
              fontSize: 48,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              color: "#f0a038",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            LittleLens
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            Developmental observations, effortlessly.
          </Text>

          {/* Email Input */}
          <TextInput
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          {/* Password Input */}
          <View style={{ position: "relative", marginBottom: 8 }}>
            <TextInput
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
                paddingRight: 52,
                fontSize: 16,
              }}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 16, top: 18 }}
            >
              <Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: "500" }}>
                {showPassword ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <Text
              style={{
                color: "#dc2626",
                fontSize: 14,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#f0a038",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              marginBottom: 16,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                New here?{" "}
                <Text style={{ color: "#f0a038", fontWeight: "600" }}>
                  Create account
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
