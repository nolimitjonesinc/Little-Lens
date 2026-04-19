import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { DEMO_TEACHER, SEED_CHILDREN, SEED_CLASSES } from "../../lib/seed-data";
import { observationCountFor, daysSinceLastObservation } from "../../lib/observationHelpers";
import NameTile from "../../components/NameTile";
import ClassPicker from "../../components/ClassPicker";

export default function QuickCapture() {
  const router = useRouter();
  const initialClassId = DEMO_TEACHER.classIds?.[0] ?? SEED_CLASSES[0].id;
  const [activeClassId, setActiveClassId] = useState(initialClassId);
  const [recentSave, setRecentSave] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (typeof global !== "undefined") {
        const saved = (global as any).__ll_last_saved;
        if (saved) {
          setRecentSave(saved);
          (global as any).__ll_last_saved = null;
          const t = setTimeout(() => setRecentSave(null), 2800);
          return () => clearTimeout(t);
        }
      }
    }, [])
  );

  const activeClass = SEED_CLASSES.find((c) => c.id === activeClassId)!;
  const children = useMemo(
    () => SEED_CHILDREN.filter((c) => c.classId === activeClassId),
    [activeClassId]
  );

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
          <Text style={{ color: "#6b7280", fontSize: 15 }}>← Done</Text>
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#78350f", fontSize: 16, fontWeight: "700" }}>Quick Capture</Text>
          <Text style={{ color: "#9ca3af", fontSize: 11 }}>Tap a name to start</Text>
        </View>
        <Pressable onPress={() => router.push("/(app)/scan")} hitSlop={12}>
          <Ionicons name="document-text-outline" size={22} color="#6b7280" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {recentSave && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 12,
              padding: 10,
              backgroundColor: "#dcfce7",
              borderRadius: 999,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#86efac",
            }}
          >
            <Text style={{ color: "#166534", fontSize: 13, fontWeight: "600" }}>
              ✓ Saved for {recentSave}
            </Text>
          </View>
        )}

        <View style={{ paddingTop: 14 }}>
          <ClassPicker classes={SEED_CLASSES} activeClassId={activeClassId} onSelect={setActiveClassId} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#78350f" }}>
              {activeClass.emoji}  {activeClass.name}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{activeClass.ageRange}</Text>
          </View>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>{children.length} children</Text>
        </View>

        {children.length === 0 ? (
          <View style={{ margin: 20, padding: 24, borderWidth: 1, borderColor: "#e8e0d5", borderRadius: 16, borderStyle: "dashed", alignItems: "center" }}>
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>No children rostered here yet.</Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              flexDirection: "row",
              flexWrap: "wrap",
              rowGap: 10,
              columnGap: 10,
            }}
          >
            {children.map((child) => {
              const count = observationCountFor(child.id);
              const days = daysSinceLastObservation(child.id);
              return (
                <View key={child.id} style={{ width: "31.5%" }}>
                  <NameTile
                    child={child}
                    observationCount={count}
                    daysSinceLast={days}
                    onPress={() => router.push(`/(app)/quick-capture/${child.id}`)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
