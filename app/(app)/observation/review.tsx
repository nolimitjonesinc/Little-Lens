import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DomainTag from "../../../components/DomainTag";
import { supabase } from "../../../lib/supabase";
import { getTeacherId } from "../../../lib/api";

export default function ObservationReview() {
  const router = useRouter();
  const { text, cleaned_text, domains, childId } = useLocalSearchParams<{
    text: string;
    cleaned_text: string;
    domains: string;
    childId: string;
  }>();

  const [isSaving, setIsSaving] = useState(false);

  const parsedDomains = domains ? JSON.parse(domains) : [];

  const handleConfirm = async () => {
    if (!childId) {
      Alert.alert("Error", "Missing child ID. Please try again.");
      return;
    }

    setIsSaving(true);
    try {
      const teacherId = await getTeacherId();

      const { error } = await supabase.from("ll_observations").insert({
        child_id: childId,
        teacher_id: teacherId,
        raw_text: text,
        cleaned_text: cleaned_text,
        domains: parsedDomains,
      });

      if (error) throw error;

      // Navigate back to child profile
      router.push(`/(app)/child/${childId}`);
    } catch (error) {
      console.error("Failed to save observation", error);
      Alert.alert("Error", "Failed to save observation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: "white", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#fde68a" }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#2d2d2d" />
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#78350f" }}>Review Observation</Text>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, gap: 24 }}>
          {/* Cleaned Observation */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#4d7c52", marginBottom: 8 }}>
              AI-Cleaned Observation
            </Text>
            <View style={{ borderRadius: 8, backgroundColor: "white", borderWidth: 1, borderColor: "#fde68a", padding: 16 }}>
              <Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2937" }}>
                {cleaned_text}
              </Text>
            </View>
          </View>

          {/* AI-Tagged Domains */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#4d7c52", marginBottom: 8 }}>
              Developmental Domains (AI-tagged)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {parsedDomains.map((tag: string, index: number) => (
                <DomainTag key={index} tag={tag} />
              ))}
            </View>
          </View>

          {/* Helper Text */}
          <View style={{ borderRadius: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", padding: 16 }}>
            <Text style={{ fontSize: 14, color: "#92400e" }}>
              Review the AI-cleaned observation and developmental domain tags before saving.
            </Text>
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={handleConfirm}
            disabled={isSaving}
            style={{
              borderRadius: 8,
              backgroundColor: isSaving ? "#d97706" : "#f0a038",
              paddingHorizontal: 24,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 16,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
              {isSaving ? "Saving..." : "Confirm & Save"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
