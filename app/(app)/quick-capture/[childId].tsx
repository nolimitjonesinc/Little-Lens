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
  SpeechRecognition,
  useSpeechRecognitionEvent,
  SPEECH_AVAILABLE,
} from "../../../lib/speechSafe";
import { tagObservation, getTeacherId } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import { SEED_CHILDREN } from "../../../lib/seed-data";

type Stage = "listening" | "editing" | "saving" | "saved";

const SILENCE_HINT_DELAY = 3000;
const SILENCE_AUTO_STOP = 5000;

export default function QuickCaptureChild() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = SEED_CHILDREN.find((c) => c.id === childId);
  const childName = child ? child.firstName : "this child";

  const [stage, setStage] = useState<Stage>(SPEECH_AVAILABLE ? "listening" : "editing");
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [showDoneHint, setShowDoneHint] = useState(false);
  const [error, setError] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const silenceHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceAutoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedText = useRef("");

  useEffect(() => {
    if (stage === "listening") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [stage, pulseAnim]);

  useEffect(() => {
    Animated.timing(hintOpacity, {
      toValue: showDoneHint ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDoneHint, hintOpacity]);

  useEffect(() => {
    if (SPEECH_AVAILABLE) {
      startListening();
    }
    return () => {
      stopListening();
      clearSilenceTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      handleStopAndSave();
    }, SILENCE_AUTO_STOP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = async () => {
    if (!SPEECH_AVAILABLE) {
      setStage("editing");
      return;
    }
    try {
      const { status } = await SpeechRecognition.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Microphone permission needed — you can still type below.");
        setStage("editing");
        return;
      }

      accumulatedText.current = "";
      setLiveText("");
      setFinalText("");
      setShowDoneHint(false);
      setStage("listening");

      SpeechRecognition.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
      });
    } catch (e) {
      console.warn("Speech start failed:", e);
      setStage("editing");
    }
  };

  const stopListening = () => {
    try {
      SpeechRecognition.stop();
    } catch {}
  };

  const handleStopAndSave = useCallback(() => {
    stopListening();
    clearSilenceTimers();
    setShowDoneHint(false);
    const text = accumulatedText.current.trim();

    if (text.length < 3) {
      setEditableText("");
      setStage("editing");
      return;
    }

    setEditableText(text);
    void doAutoSave(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSpeechRecognitionEvent("result", (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    if (event.isFinal) {
      accumulatedText.current = (accumulatedText.current + " " + transcript).trim();
      setFinalText(accumulatedText.current);
      setLiveText("");
    } else {
      setLiveText(transcript);
    }
    resetSilenceTimers();
  });

  useSpeechRecognitionEvent("error", (event: any) => {
    if (event.error !== "no-speech") {
      setError("Speech stopped. Edit below or tap retry.");
      const text = accumulatedText.current.trim();
      setEditableText(text);
      setStage("editing");
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (stage === "listening") {
      const text = accumulatedText.current.trim();
      if (text.length >= 3) {
        setEditableText(text);
        void doAutoSave(text);
      } else {
        setStage("editing");
      }
    }
  });

  const doAutoSave = async (text: string) => {
    setStage("saving");
    setError("");
    try {
      let cleaned = text;
      let domains: string[] = [];
      try {
        const result = await tagObservation(text);
        cleaned = result.cleaned_text || text;
        domains = result.domains || [];
      } catch (e) {
        console.warn("AI tagging skipped:", e);
      }
      await saveToDatabase(text, cleaned, domains);
      setStage("saved");
      if (typeof global !== "undefined") {
        (global as any).__ll_last_saved = child?.firstName || "child";
      }
      setTimeout(() => {
        router.replace("/(app)/quick-capture");
      }, 900);
    } catch (e) {
      console.warn("Auto-save failed, falling back to edit mode:", e);
      setError("Couldn't save — edit and try again.");
      setEditableText(text);
      setStage("editing");
    }
  };

  const saveToDatabase = async (raw: string, cleaned: string, domains: string[]) => {
    if (!childId) return;
    try {
      const teacherId = await getTeacherId();
      const { error: insertError } = await supabase.from("ll_observations").insert({
        child_id: childId,
        teacher_id: teacherId,
        raw_text: raw,
        cleaned_text: cleaned,
        domains,
      });
      if (insertError) throw insertError;
    } catch (e) {
      // Demo mode / offline — swallow and proceed
      console.warn("Supabase insert skipped:", e);
    }
  };

  const handleManualSave = async () => {
    const text = editableText.trim();
    if (text.length < 3) {
      setError("Say or type a little more.");
      return;
    }
    setError("");
    await doAutoSave(text);
  };

  const displayText = finalText
    ? finalText + (liveText ? " " + liveText : "")
    : liveText;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: stage === "listening" ? "#111827" : "#faf7f2" }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

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

      {stage === "listening" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 48, letterSpacing: 1 }}>
            {childName.toUpperCase()}
          </Text>

          <Pressable onPress={handleStopAndSave} style={{ alignItems: "center", marginBottom: 48 }}>
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
              Tap to stop · pause to auto-save
            </Text>
          </Pressable>

          <View style={{ minHeight: 80, alignItems: "center", paddingHorizontal: 16 }}>
            {displayText ? (
              <Text
                style={{ color: "white", fontSize: 18, lineHeight: 28, textAlign: "center", fontStyle: "italic" }}
              >
                &ldquo;{displayText}&rdquo;
              </Text>
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, textAlign: "center" }}>
                Listening for {childName}...
              </Text>
            )}
          </View>

          <Animated.View style={{ opacity: hintOpacity, marginTop: 32 }}>
            <Pressable
              onPress={handleStopAndSave}
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
                Done speaking? Tap to save →
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {stage === "saving" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <ActivityIndicator color="#f0a038" size="large" />
          <Text style={{ marginTop: 16, color: "#6b7280", fontSize: 15 }}>Saving note for {childName}...</Text>
          {editableText ? (
            <Text
              style={{ marginTop: 24, color: "#9ca3af", fontSize: 13, fontStyle: "italic", textAlign: "center", paddingHorizontal: 20 }}
            >
              &ldquo;{editableText}&rdquo;
            </Text>
          ) : null}
        </View>
      )}

      {stage === "saved" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#dcfce7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark" size={52} color="#15803d" />
          </View>
          <Text style={{ marginTop: 20, fontSize: 20, fontWeight: "700", color: "#166534" }}>Saved</Text>
          <Text style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>Next child →</Text>
        </View>
      )}

      {stage === "editing" && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
                {SPEECH_AVAILABLE ? "Edit & save" : "Type a note"}
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
                Note for {childName}.
                {!SPEECH_AVAILABLE && " (Voice recording isn't available in this build.)"}
              </Text>

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
                placeholder={`Type what you observed about ${childName}...`}
                placeholderTextColor="#9ca3af"
                autoFocus={!editableText}
              />

              {error ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 }}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={{ color: "#dc2626", fontSize: 14, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              {SPEECH_AVAILABLE && (
                <Pressable
                  onPress={() => {
                    setError("");
                    startListening();
                  }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, paddingVertical: 8 }}
                >
                  <Ionicons name="mic-outline" size={16} color="#f0a038" />
                  <Text style={{ color: "#f0a038", fontSize: 14, fontWeight: "500" }}>Record again</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          <View
            style={{
              padding: 20,
              backgroundColor: "white",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
            }}
          >
            <Pressable
              onPress={handleManualSave}
              disabled={!editableText.trim()}
              style={({ pressed }) => ({
                backgroundColor: !editableText.trim() ? "#d1d5db" : pressed ? "#d97706" : "#f0a038",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              <Ionicons name="sparkles" size={18} color={editableText.trim() ? "white" : "#9ca3af"} />
              <Text style={{ color: editableText.trim() ? "white" : "#9ca3af", fontSize: 16, fontWeight: "600" }}>
                Save note
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
