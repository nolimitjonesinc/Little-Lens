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

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    // Step 1: Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Failed to create account");
      setLoading(false);
      return;
    }

    // Step 2: Insert teacher record
    const { error: insertError } = await supabase.from("ll_teachers").insert({
      user_id: data.user.id,
      name: name.trim(),
      school_name: "Maple Tree Academy",
    });

    setLoading(false);

    if (insertError) {
      setError("Account created but profile setup failed. Please contact support.");
      return;
    }

    // Check if email confirmation is required
    if (data.session) {
      // User is automatically signed in
      router.replace("/(app)/dashboard");
    } else {
      // Email confirmation required
      setSuccess(
        "Account created! Please check your email to verify your account before signing in."
      );
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

          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              color: "#1f2937",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Create Account
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
            Join LittleLens today
          </Text>

          {/* Name Input */}
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
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />

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
              autoComplete="password-new"
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

          {/* Success Message */}
          {success ? (
            <Text
              style={{
                color: "#059669",
                fontSize: 14,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {success}
            </Text>
          ) : null}

          {/* Create Account Button */}
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
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Already have an account?{" "}
                <Text style={{ color: "#f0a038", fontWeight: "600" }}>
                  Sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
