import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SEED_CHILDREN, SEED_OBSERVATIONS } from "../../../lib/seed-data";
import { getAge } from "../../../lib/utils";
import ObservationItem from "../../../components/ObservationItem";
import { supabase } from "../../../lib/supabase";
import type { Observation } from "../../../lib/types";

export default function ChildProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const child = SEED_CHILDREN.find((c) => c.id === id);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchObservations();
  }, [id]);

  const fetchObservations = async () => {
    // Seed data uses string IDs like "child-maya" — not valid UUIDs, skip Supabase
    const isRealId = /^[0-9a-f-]{36}$/.test(id ?? "");

    if (!isRealId) {
      const seedObs = SEED_OBSERVATIONS.filter(
        (obs) => obs.childId === id && obs.confirmed
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setObservations(seedObs);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ll_observations")
        .select("*")
        .eq("child_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map Supabase data to Observation type
        const mappedObs: Observation[] = data.map((obs) => ({
          id: obs.id,
          childId: obs.child_id,
          rawTranscript: obs.raw_text,
          cleanedObservation: obs.cleaned_text,
          tags: obs.domains || [],
          confirmed: true,
          createdAt: new Date(obs.created_at),
        }));
        setObservations(mappedObs);
      } else {
        // Fall back to seed data if no real observations
        const seedObs = SEED_OBSERVATIONS.filter(
          (obs) => obs.childId === id && obs.confirmed
        ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setObservations(seedObs);
      }
    } catch (error) {
      console.error("Failed to fetch observations", error);
      // Fall back to seed data on error
      const seedObs = SEED_OBSERVATIONS.filter(
        (obs) => obs.childId === id && obs.confirmed
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setObservations(seedObs);
    } finally {
      setIsLoading(false);
    }
  };

  if (!child) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }}>
        <Text style={{ padding: 24, textAlign: "center" }}>Child not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: "white", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#fde68a" }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#2d2d2d" />
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#78350f" }}>
                {child.firstName} {child.lastName}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 14, color: "#4d7c52" }}>Age {getAge(child.dateOfBirth)}</Text>
            </View>
            <Text style={{ fontSize: 48 }}>{child.photo}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, gap: 12 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/(app)/capture", params: { childId: child.id } })}
            style={{ borderRadius: 8, backgroundColor: "#f0a038", paddingHorizontal: 24, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>+ Add Observation</Text>
          </Pressable>

          {observations.length >= 5 && (
            <Pressable
              onPress={() => router.push(`/(app)/report/${child.id}`)}
              style={{ borderRadius: 8, backgroundColor: "#669c6f", paddingHorizontal: 24, paddingVertical: 16, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>Generate Report</Text>
            </Pressable>
          )}
        </View>

        {/* Observations List */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#78350f", marginBottom: 16 }}>
            Observations ({observations.length})
          </Text>

          {isLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#f0a038" />
            </View>
          ) : observations.length === 0 ? (
            <View style={{ borderRadius: 8, backgroundColor: "white", borderWidth: 1, borderColor: "#fde68a", padding: 32, alignItems: "center" }}>
              <Text style={{ color: "#4d7c52", textAlign: "center" }}>
                No observations yet. Tap "Add Observation" to get started.
              </Text>
            </View>
          ) : (
            observations.map((obs) => <ObservationItem key={obs.id} observation={obs} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
