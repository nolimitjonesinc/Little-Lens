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
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  SpeechRecognition,
  useSpeechRecognitionEvent,
  SPEECH_AVAILABLE,
} from "../../../lib/speechSafe";
import { tagObservation, getTeacherId } from "../../../lib/api";
import { uploadObservationPhoto } from "../../../lib/photoStorage";
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
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

    if (text.length < 3 && !photoUri) {
      setEditableText("");
      setStage("editing");
      return;
    }

    setEditableText(text);
    void doAutoSave(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri]);

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
      if (text.length >= 3 || photoUri) {
        setEditableText(text);
        void doAutoSave(text);
      } else {
        setStage("editing");
      }
    }
  });

  const handleTakePhoto = async () => {
    stopListening();
    clearSilenceTimers();
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera access needed", "Allow camera access in Settings.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (stage === "listening") setStage("editing");
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Camera unavailable", "This feature needs a rebuild to work.");
    }
  };

  const handlePickPhoto = async () => {
    stopListening();
    clearSilenceTimers();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos access needed", "Allow photo library access in Settings.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (stage === "listening") setStage("editing");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const doAutoSave = async (text: string) => {
    setStage("saving");
    setError("");
    try {
      let cleaned = text;
      let domains: string[] = [];
      if (text.trim().length > 0) {
        try {
          const result = await tagObservation(text);
          cleaned = result.cleaned_text || text;
          domains = result.domains || [];
        } catch (e) {
          console.warn("AI tagging skipped:", e);
        }
      }

      let photoUrl: string | null = null;
      if (photoUri && childId) {
        const uploaded = await uploadObservationPhoto(childId, photoUri);
        photoUrl = uploaded.publicUrl;
      }

      await saveToDatabase(text, cleaned, domains, photoUrl, photoUri);
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

  const saveToDatabase = async (
    raw: string,
    cleaned: string,
    domains: string[],
    photoUrl: string | null,
    localPhotoUri: string | null
  ) => {
    if (!childId) return;
    try {
      const teacherId = await getTeacherId();
      const record: any = {
        child_id: childId,
        teacher_id: teacherId,
        raw_text: raw,
        cleaned_text: cleaned || (photoUrl || localPhotoUri ? "(photo)" : ""),
        domains,
      };
      if (photoUrl) record.photo_url = photoUrl;
      else if (localPhotoUri) record.photo_url = localPhotoUri;

      const { error: insertError } = await supabase.from("ll_observations").insert(record);
      if (insertError) throw insertError;
    } catch (e) {
      console.warn("Supabase insert skipped:", e);
    }
  };

  const handleManualSave = async () => {
    const text = editableText.trim();
    if (text.length < 3 && !photoUri) {
      setError("Add a note or a photo.");
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
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 40, letterSpacing: 1 }}>
            {childName.toUpperCase()}
          </Text>

          <Pressable onPress={handleStopAndSave} style={{ alignItems: "center", marginBottom: 24 }}>
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
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 16 }}>
              Tap to stop · pause to auto-save
            </Text>
          </Pressable>

          <Pressable
            onPress={handleTakePhoto}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 999,
              gap: 8,
              marginBottom: 20,
            }}
          >
            <Ionicons name="camera-outline" size={20} color="white" />
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Add a photo</Text>
          </Pressable>

          <View style={{ minHeight: 60, alignItems: "center", paddingHorizontal: 16 }}>
            {displayText ? (
              <Text
                style={{ color: "white", fontSize: 16, lineHeight: 24, textAlign: "center", fontStyle: "italic" }}
              >
                &ldquo;{displayText}&rdquo;
              </Text>
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center" }}>
                Listening for {childName}...
              </Text>
            )}
          </View>

          <Animated.View style={{ opacity: hintOpacity, marginTop: 16 }}>
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
          {photoUri && (
            <Image source={{ uri: photoUri }} style={{ marginTop: 16, width: 120, height: 120, borderRadius: 12 }} />
          )}
          {editableText ? (
            <Text
              style={{ marginTop: 20, color: "#9ca3af", fontSize: 13, fontStyle: "italic", textAlign: "center", paddingHorizontal: 20 }}
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
                {photoUri && editableText === "" ? "Add context (optional)" : "Edit & save"}
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
                Note for {childName}.
              </Text>

              {photoUri && (
                <View style={{ marginBottom: 14 }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: 220, borderRadius: 14, backgroundColor: "#e5e7eb" }}
                  />
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <Pressable
                      onPress={handleTakePhoto}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fef3c7" }}
                    >
                      <Ionicons name="refresh" size={14} color="#b45309" />
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#b45309" }}>Retake</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPhotoUri(null)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fee2e2" }}
                    >
                      <Ionicons name="trash" size={14} color="#b91c1c" />
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#b91c1c" }}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: error ? "#fca5a5" : "#e5e7eb",
                  padding: 16,
                  fontSize: 16,
                  lineHeight: 24,
                  minHeight: 140,
                  textAlignVertical: "top",
                  color: "#1f2937",
                }}
                multiline
                value={editableText}
                onChangeText={(t) => {
                  setEditableText(t);
                  if (error) setError("");
                }}
                placeholder={photoUri ? "What happened in this photo? (optional)" : `Type what you observed about ${childName}...`}
                placeholderTextColor="#9ca3af"
                autoFocus={!editableText && !photoUri}
              />

              {error ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 }}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={{ color: "#dc2626", fontSize: 14, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {SPEECH_AVAILABLE && (
                  <Pressable
                    onPress={() => {
                      setError("");
                      startListening();
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fef3c7" }}
                  >
                    <Ionicons name="mic-outline" size={16} color="#b45309" />
                    <Text style={{ color: "#b45309", fontSize: 13, fontWeight: "600" }}>Record voice</Text>
                  </Pressable>
                )}

                {!photoUri && (
                  <>
                    <Pressable
                      onPress={handleTakePhoto}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fef3c7" }}
                    >
                      <Ionicons name="camera-outline" size={16} color="#b45309" />
                      <Text style={{ color: "#b45309", fontSize: 13, fontWeight: "600" }}>Take photo</Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePickPhoto}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#eef0ed" }}
                    >
                      <Ionicons name="images-outline" size={16} color="#4d7c52" />
                      <Text style={{ color: "#4d7c52", fontSize: 13, fontWeight: "600" }}>Choose photo</Text>
                    </Pressable>
                  </>
                )}
              </View>
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
              disabled={!editableText.trim() && !photoUri}
              style={({ pressed }) => ({
                backgroundColor: !editableText.trim() && !photoUri ? "#d1d5db" : pressed ? "#d97706" : "#f0a038",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              <Ionicons name="sparkles" size={18} color={(editableText.trim() || photoUri) ? "white" : "#9ca3af"} />
              <Text style={{ color: (editableText.trim() || photoUri) ? "white" : "#9ca3af", fontSize: 16, fontWeight: "600" }}>
                Save {photoUri ? "photo & " : ""}note
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
