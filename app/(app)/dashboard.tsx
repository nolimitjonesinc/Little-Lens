import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DEMO_TEACHER, DEMO_SCHOOL, SEED_CHILDREN, SEED_CLASSES, SEED_OBSERVATIONS } from "../../lib/seed-data";
import { observationCountFor, daysSinceLastObservation } from "../../lib/observationHelpers";
import ChildCard from "../../components/ChildCard";
import ClassPicker from "../../components/ClassPicker";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const initialClassId = DEMO_TEACHER.classIds?.[0] ?? SEED_CLASSES[0].id;
  const [activeClassId, setActiveClassId] = useState(initialClassId);

  const activeClass = SEED_CLASSES.find((c) => c.id === activeClassId)!;
  const children = useMemo(
    () => SEED_CHILDREN.filter((c) => c.classId === activeClassId),
    [activeClassId]
  );

  const totalObsThisClass = children.reduce((sum, c) => sum + observationCountFor(c.id), 0);
  const staleCount = children.filter((c) => {
    const d = daysSinceLastObservation(c.id);
    return d === null || d >= 7;
  }).length;

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#fde68a",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#78350f" }}>LittleLens</Text>
            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {DEMO_TEACHER.name} · {DEMO_SCHOOL.name}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable onPress={() => router.push("/(app)/scan")} hitSlop={10}>
              <Ionicons name="document-text-outline" size={22} color="#6b7280" />
            </Pressable>
            <TouchableOpacity onPress={handleSignOut} style={{ padding: 4 }}>
              <Ionicons name="log-out-outline" size={22} color="#78716c" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Big Quick Capture CTA */}
        <Pressable
          onPress={() => router.push("/(app)/quick-capture")}
          style={({ pressed }) => ({
            marginHorizontal: 20,
            marginTop: 18,
            borderRadius: 24,
            padding: 20,
            backgroundColor: "#f0a038",
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#f0a038",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name="mic" size={28} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Quick Capture</Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 2 }}>
              Tap a child · speak · walk away
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* Class picker */}
        <View style={{ paddingTop: 18 }}>
          <ClassPicker classes={SEED_CLASSES} activeClassId={activeClassId} onSelect={setActiveClassId} />
        </View>

        {/* Summary tiles */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14 }}>
          <StatTile label="Children" value={String(children.length)} emoji={activeClass.emoji} />
          <StatTile label="Notes" value={String(totalObsThisClass)} emoji="✎" />
          <StatTile label="Need note" value={String(staleCount)} emoji="⏰" warn={staleCount > 0} />
        </View>

        {/* Class section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#78350f" }}>
            {activeClass.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{activeClass.ageRange}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
          {children.length === 0 ? (
            <View
              style={{
                padding: 24,
                borderWidth: 1,
                borderColor: "#e8e0d5",
                borderRadius: 16,
                borderStyle: "dashed",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>No children in this class yet.</Text>
            </View>
          ) : (
            children.map((child) => (
              <ChildCard key={child.id} child={child} observationCount={observationCountFor(child.id)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, emoji, warn }: { label: string; value: string; emoji: string; warn?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: warn ? "#fbbf24" : "#e8e0d5",
        backgroundColor: "white",
        padding: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: warn ? "#b45309" : "#78350f" }}>{value}</Text>
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: "600", color: "#9ca3af", marginTop: 4, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
