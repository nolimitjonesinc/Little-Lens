import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SEED_CHILDREN } from "../../../lib/seed-data";
import DomainTag from "../../../components/DomainTag";
import { supabase } from "../../../lib/supabase";
import { generateReport } from "../../../lib/api";
import { getAge } from "../../../lib/utils";

export default function Report() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();

  const child = SEED_CHILDREN.find((c) => c.id === childId);
  const [observations, setObservations] = useState<any[]>([]);
  const [reportText, setReportText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchObservations();
  }, [childId]);

  const fetchObservations = async () => {
    try {
      const { data, error } = await supabase
        .from("ll_observations")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setObservations(data || []);
    } catch (error) {
      console.error("Failed to fetch observations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!child || observations.length === 0) return;

    setIsGenerating(true);
    try {
      const observationsFormatted = observations.map((obs) => ({
        cleaned_text: obs.cleaned_text,
        domains: obs.domains,
        created_at: obs.created_at,
      }));

      const currentDate = new Date();
      const period = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      const result = await generateReport({
        childName: `${child.firstName} ${child.lastName}`,
        childAge: getAge(child.dateOfBirth).toString(),
        observations: observationsFormatted,
        period,
        year: currentDate.getFullYear(),
      });

      setReportText(result.report);
    } catch (error) {
      console.error("Failed to generate report", error);
      Alert.alert("Error", "Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!child) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }}>
        <Text style={{ padding: 24, textAlign: "center" }}>Child not found</Text>
      </SafeAreaView>
    );
  }

  // Collect all unique tags
  const allTags = Array.from(new Set(observations.flatMap((obs) => obs.domains || [])));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: "white", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#fde68a" }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#2d2d2d" />
          </Pressable>

          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#78350f" }}>
            {child.firstName}'s Report
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: "#4d7c52" }}>
            Based on {observations.length} observations
          </Text>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, gap: 24 }}>
          {isLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#f0a038" />
            </View>
          ) : (
            <>
              {/* Report Period */}
              <View style={{ borderRadius: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", padding: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#92400e", marginBottom: 4 }}>Report Period</Text>
                <Text style={{ fontSize: 14, color: "#92400e" }}>
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </Text>
              </View>

              {/* Developmental Domains Covered */}
              {allTags.length > 0 && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#4d7c52", marginBottom: 12 }}>
                    Developmental Domains Covered
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {allTags.map((tag, index) => (
                      <DomainTag key={index} tag={tag} />
                    ))}
                  </View>
                </View>
              )}

              {/* Generate Report Button */}
              {!reportText && (
                <Pressable
                  onPress={handleGenerateReport}
                  disabled={isGenerating || observations.length === 0}
                  style={{
                    borderRadius: 8,
                    backgroundColor: isGenerating ? "#d97706" : "#669c6f",
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    alignItems: "center",
                    opacity: isGenerating || observations.length === 0 ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
                    {isGenerating ? "Generating Report..." : "Generate AI Report"}
                  </Text>
                </Pressable>
              )}

              {/* Narrative Summary */}
              {reportText && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#4d7c52", marginBottom: 12 }}>
                    Summary & Recommendations
                  </Text>
                  <View style={{ borderRadius: 8, backgroundColor: "white", borderWidth: 1, borderColor: "#fde68a", padding: 16 }}>
                    <Text style={{ fontSize: 16, lineHeight: 28, color: "#1f2937" }}>{reportText}</Text>
                  </View>
                </View>
              )}

              {/* Export Button */}
              {reportText && (
                <Pressable
                  style={{
                    borderRadius: 8,
                    backgroundColor: "#669c6f",
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    alignItems: "center",
                    marginTop: 16,
                  }}
                  onPress={() => {
                    Alert.alert("Coming Soon", "Export feature will be available soon!");
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>Share / Export</Text>
                  </View>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
