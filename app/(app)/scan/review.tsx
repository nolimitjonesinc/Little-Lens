import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SEED_CHILDREN } from "../../../lib/seed-data";
import { scanHandwrittenNotes, getTeacherId, ScannedItem } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

interface ReviewRow {
  id: string;
  childId: string | null;
  childNameRaw: string;
  note: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  include: boolean;
}

type Phase = "loading" | "processing" | "review" | "error" | "saving" | "done";

export default function ScanReview() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const pending = typeof global !== "undefined" ? (global as any).__ll_pending_scan : null;
    if (!pending) {
      router.replace("/(app)/scan");
      return;
    }
    setImageUri(pending.uri);
    void runScan(pending.base64, pending.mimeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchChild = (raw: string) => {
    const n = raw.trim().toLowerCase();
    return SEED_CHILDREN.find(
      (c) =>
        c.firstName.toLowerCase() === n ||
        `${c.firstName.toLowerCase()} ${c.lastName.toLowerCase()}` === n ||
        c.firstName.toLowerCase().startsWith(n)
    );
  };

  async function runScan(imageBase64: string, mimeType: string) {
    setPhase("processing");
    try {
      const data = await scanHandwrittenNotes({
        imageBase64,
        mimeType,
        roster: SEED_CHILDREN.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName })),
      });
      const items: ScannedItem[] = data.items || [];
      if (items.length === 0) {
        setErrorMsg("No observations detected in that image. Try a clearer photo.");
        setPhase("error");
        return;
      }
      const mapped: ReviewRow[] = items.map((it, i) => {
        const matched = matchChild(it.childName);
        return {
          id: `scan-${Date.now()}-${i}`,
          childId: matched?.id ?? null,
          childNameRaw: it.childName,
          note: it.note,
          tags: it.tags || [],
          confidence: it.confidence,
          include: true,
        };
      });
      setRows(mapped);
      setPhase("review");
    } catch (e: any) {
      console.warn(e);
      setErrorMsg(e?.message || "Scan failed. Check your connection.");
      setPhase("error");
    }
  }

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const includedReady = useMemo(
    () => rows.filter((r) => r.include && r.childId).length,
    [rows]
  );

  async function saveAll() {
    const toSave = rows.filter((r) => r.include && r.childId);
    if (toSave.length === 0) {
      Alert.alert("Pick a child for each note", "Use the dropdown on each row, or uncheck rows you don't want.");
      return;
    }

    setPhase("saving");
    try {
      const teacherId = await getTeacherId();
      const inserts = toSave.map((r) => ({
        child_id: r.childId!,
        teacher_id: teacherId,
        raw_text: r.note,
        cleaned_text: r.note,
        domains: r.tags,
      }));
      const { error } = await supabase.from("ll_observations").insert(inserts);
      if (error) throw error;
      setPhase("done");
      setTimeout(() => {
        if (typeof global !== "undefined") (global as any).__ll_pending_scan = null;
        router.replace("/(app)/dashboard");
      }, 1200);
    } catch (e) {
      console.warn("Save failed", e);
      Alert.alert("Couldn't save", "Check your connection and try again.");
      setPhase("review");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#e8e0d5",
          backgroundColor: "white",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: "#6b7280", fontSize: 15 }}>← Retake</Text>
        </Pressable>
        <Text style={{ color: "#78350f", fontSize: 16, fontWeight: "700" }}>Review scan</Text>
        <View style={{ width: 60 }} />
      </View>

      {phase === "processing" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <ActivityIndicator color="#f0a038" size="large" />
          <Text style={{ color: "#6b7280", marginTop: 14, fontSize: 15 }}>Reading your handwriting...</Text>
          <Text style={{ color: "#9ca3af", marginTop: 4, fontSize: 12, textAlign: "center" }}>
            Usually 5–10 seconds
          </Text>
        </View>
      )}

      {phase === "error" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#fef3c7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="warning" size={32} color="#b45309" />
          </View>
          <Text style={{ color: "#78350f", fontWeight: "700", marginTop: 14, fontSize: 17 }}>
            Couldn&apos;t scan that page
          </Text>
          <Text style={{ color: "#6b7280", marginTop: 8, textAlign: "center", fontSize: 14 }}>{errorMsg}</Text>
          <Pressable
            onPress={() => router.replace("/(app)/scan")}
            style={{
              marginTop: 20,
              backgroundColor: "#f0a038",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Try again</Text>
          </Pressable>
        </View>
      )}

      {(phase === "review" || phase === "saving") && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {imageUri && (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#e8e0d5",
                padding: 8,
                marginBottom: 14,
                alignItems: "center",
              }}
            >
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 160, borderRadius: 8 }} resizeMode="cover" />
              <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 6 }}>Original page</Text>
            </View>
          )}

          <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>
            <Text style={{ fontWeight: "700" }}>{rows.filter((r) => r.include).length}</Text> observations detected.
            Confirm the child for each, then Save All.
          </Text>

          {rows.map((row) => {
            const needsMatch = !row.childId;
            return (
              <View
                key={row.id}
                style={{
                  marginBottom: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: needsMatch ? "#fbbf24" : "#e8e0d5",
                  backgroundColor: "white",
                  padding: 12,
                  opacity: row.include ? 1 : 0.5,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable
                    onPress={() => updateRow(row.id, { include: !row.include })}
                    hitSlop={10}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: row.include ? "#f0a038" : "#cbd5e1",
                      backgroundColor: row.include ? "#f0a038" : "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {row.include && <Ionicons name="checkmark" size={14} color="white" />}
                  </Pressable>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      Scanned as: <Text style={{ fontWeight: "600" }}>&ldquo;{row.childNameRaw}&rdquo;</Text>
                      {row.confidence !== "high" && (
                        <Text style={{ color: "#b45309" }}> · {row.confidence}</Text>
                      )}
                    </Text>
                  </View>
                </View>

                {/* Child picker */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                  contentContainerStyle={{ gap: 6, paddingRight: 10 }}
                >
                  {SEED_CHILDREN.map((c) => {
                    const active = row.childId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => updateRow(row.id, { childId: c.id })}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? "#f0a038" : "#e8e0d5",
                          backgroundColor: active ? "#f0a038" : "white",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: active ? "white" : "#6b7280",
                          }}
                        >
                          {c.firstName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <TextInput
                  value={row.note}
                  onChangeText={(t) => updateRow(row.id, { note: t })}
                  multiline
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#faf7f2",
                    fontSize: 14,
                    lineHeight: 20,
                    color: "#1f2937",
                    minHeight: 60,
                    textAlignVertical: "top",
                  }}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      {phase === "review" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e8e0d5",
          }}
        >
          <Pressable
            onPress={saveAll}
            disabled={includedReady === 0}
            style={({ pressed }) => ({
              backgroundColor: includedReady === 0 ? "#d1d5db" : pressed ? "#4d7c52" : "#65835b",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            })}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              Save All ({includedReady})
            </Text>
          </Pressable>
        </View>
      )}

      {phase === "saving" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e8e0d5",
            alignItems: "center",
          }}
        >
          <ActivityIndicator color="#f0a038" />
          <Text style={{ color: "#6b7280", marginTop: 4 }}>Saving observations...</Text>
        </View>
      )}

      {phase === "done" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
          <Text style={{ marginTop: 20, fontSize: 20, fontWeight: "700", color: "#166534" }}>
            All saved
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
            Returning to dashboard...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
