import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SpeechRecognition as ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  SPEECH_AVAILABLE,
} from "../../lib/speechSafe";
import { tagObservation } from "../../lib/api";
import { SEED_CHILDREN } from "../../lib/seed-data";

type Stage = "listening" | "done" | "analyzing";

const SILENCE_HINT_DELAY = 3000;  // show "done?" hint after 3s silence
const SILENCE_AUTO_STOP = 5000;   // auto-stop after 5s silence

export default function Capture() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = SEED_CHILDREN.find((c) => c.id === childId);
  const childName = child ? child.firstName : "this child";

  const [stage, setStage] = useState<Stage>("listening");
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [showDoneHint, setShowDoneHint] = useState(false);
  const [error, setError] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const silenceHintTimer = useRef<NodeJS.Timeout | null>(null);
  const silenceAutoTimer = useRef<NodeJS.Timeout | null>(null);
  const accumulatedText = useRef("");

  // ─── Pulse animation while listening ───────────────────────────────────────
  useEffect(() => {
    if (stage === "listening") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [stage, pulseAnim]);

  // ─── Fade hint in/out ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(hintOpacity, {
      toValue: showDoneHint ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDoneHint, hintOpacity]);

  // ─── Start recording on mount ───────────────────────────────────────────────
  useEffect(() => {
    startListening();
    return () => {
      stopListening();
      clearSilenceTimers();
    };
  }, []);

  const clearSilenceTimers = () => {
    if (silenceHintTimer.current) clearTimeout(silenceHintTimer.current);
    if (silenceAutoTimer.current) clearTimeout(silenceAutoTimer.current);
  };

  const resetSilenceTimers = useCallback(() => {
    clearSilenceTimers();
    setShowDoneHint(false);

    silenceHintTimer.current = setTimeout(() => {
      setShowDoneHint(true);
    }, SILENCE_HINT_DELAY);

    silenceAutoTimer.current = setTimeout(() => {
      handleStopAndReview();
    }, SILENCE_AUTO_STOP);
  }, []);

  const startListening = async () => {
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (status !== "granted") {
      setError("Microphone permission is required to record observations.");
      return;
    }

    accumulatedText.current = "";
    setLiveText("");
    setFinalText("");
    setShowDoneHint(false);
    setStage("listening");

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: false,
    });
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const handleStopAndReview = useCallback(() => {
    stopListening();
    clearSilenceTimers();
    setShowDoneHint(false);

    const text = accumulatedText.current.trim();
    setEditableText(text);
    setStage("done");
  }, []);

  // ─── Speech recognition events ─────────────────────────────────────────────
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    if (event.isFinal) {
      // Append finalized segment, then start fresh
      accumulatedText.current = (accumulatedText.current + " " + transcript).trim();
      setFinalText(accumulatedText.current);
      setLiveText("");
    } else {
      setLiveText(transcript);
    }
    resetSilenceTimers();
  });

  useSpeechRecognitionEvent("error", (event) => {
    // "no-speech" just means silence — not a real error, ignore it
    if (event.error !== "no-speech") {
      setError("Speech recognition stopped. Tap the mic to try again.");
      setStage("done");
    }
  });

  useSpeechRecognitionEvent("end", () => {
    // If still in listening stage when recognition ends (e.g. iOS 1-min limit),
    // auto-transition to review
    if (stage === "listening") {
      const text = accumulatedText.current.trim();
      setEditableText(text);
      setStage("done");
    }
  });

  // ─── Analyze ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const text = editableText.trim();
    if (!text || text.length < 5) {
      setError("Say a little more — just a sentence or two about what you saw.");
      return;
    }

    setError("");
    setStage("analyzing");

    try {
      const result = await tagObservation(text);
      router.push({
        pathname: "/(app)/observation/review",
        params: {
          text,
          cleaned_text: result.cleaned_text,
          domains: JSON.stringify(result.domains),
          childId: childId || "",
        },
      });
    } catch {
      setError("Couldn't reach the AI. Check your connection and try again.");
      setStage("done");
    }
  };

  // ─── Display text (live interim + finalized) ────────────────────────────────
  const displayText = finalText
    ? finalText + (liveText ? " " + liveText : "")
    : liveText;

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: stage === "listening" ? "#111827" : "#faf7f2" }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Close button */}
      <Pressable
        onPress={() => {
          stopListening();
          router.back();
        }}
        style={{ position: "absolute", top: 56, right: 20, zIndex: 10, padding: 8 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="close"
          size={24}
          color={stage === "listening" ? "rgba(255,255,255,0.5)" : "#6b7280"}
        />
      </Pressable>

      {/* ── LISTENING STATE ─────────────────────────────────────── */}
      {stage === "listening" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          {/* Child name */}
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 48, letterSpacing: 1 }}>
            {childName.toUpperCase()}
          </Text>

          {/* Pulsing mic ring */}
          <Pressable onPress={handleStopAndReview} style={{ alignItems: "center", marginBottom: 48 }}>
            <Animated.View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: "rgba(240,160,56,0.15)",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  backgroundColor: "#f0a038",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="mic" size={52} color="white" />
              </View>
            </Animated.View>

            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 20 }}>
              Tap to stop
            </Text>
          </Pressable>

          {/* Live transcription */}
          <View style={{ minHeight: 80, alignItems: "center", paddingHorizontal: 16 }}>
            {displayText ? (
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  lineHeight: 28,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                "{displayText}"
              </Text>
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, textAlign: "center" }}>
                Listening for {childName}...
              </Text>
            )}
          </View>

          {/* Done hint */}
          <Animated.View style={{ opacity: hintOpacity, marginTop: 32 }}>
            <Pressable
              onPress={handleStopAndReview}
              style={{
                backgroundColor: "rgba(240,160,56,0.2)",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(240,160,56,0.4)",
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#f0a038", fontSize: 14, fontWeight: "600" }}>
                Done speaking? Tap to analyze →
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* ── DONE / EDIT STATE ───────────────────────────────────── */}
      {(stage === "done" || stage === "analyzing") && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
              {/* Header */}
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
                Review observation
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
                Edit anything, then let AI tag it.
              </Text>

              {/* Editable text */}
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: error ? "#fca5a5" : "#e5e7eb",
                  padding: 16,
                  fontSize: 16,
                  lineHeight: 24,
                  minHeight: 180,
                  textAlignVertical: "top",
                  color: "#1f2937",
                }}
                multiline
                value={editableText}
                onChangeText={(t) => {
                  setEditableText(t);
                  if (error) setError("");
                }}
                placeholder="No speech detected. Type your observation here..."
                placeholderTextColor="#9ca3af"
                autoFocus={!editableText}
              />

              {error ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 }}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={{ color: "#dc2626", fontSize: 14, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              {/* Record again */}
              <Pressable
                onPress={() => {
                  setError("");
                  startListening();
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, paddingVertical: 8 }}
              >
                <Ionicons name="mic-outline" size={16} color="#f0a038" />
                <Text style={{ color: "#f0a038", fontSize: 14, fontWeight: "500" }}>
                  Record again
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Analyze button */}
          <View
            style={{
              padding: 20,
              backgroundColor: "white",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
            }}
          >
            <Pressable
              onPress={handleAnalyze}
              disabled={stage === "analyzing" || !editableText.trim()}
              style={({ pressed }) => ({
                backgroundColor:
                  stage === "analyzing" || !editableText.trim()
                    ? "#d1d5db"
                    : pressed
                    ? "#d97706"
                    : "#f0a038",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              {stage === "analyzing" ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    Analyzing with AI...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color={editableText.trim() ? "white" : "#9ca3af"}
                  />
                  <Text
                    style={{
                      color: editableText.trim() ? "white" : "#9ca3af",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Analyze with AI
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
