import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Child } from "../lib/types";
import { getAge, formatDate } from "../lib/utils";
import { daysSinceLastObservation } from "../lib/observationHelpers";

interface ChildCardProps {
  child: Child;
  observationCount: number;
}

export default function ChildCard({ child, observationCount }: ChildCardProps) {
  const isReportReady = observationCount >= 5;
  const progressPercent = Math.min((observationCount / 5) * 100, 100);
  const days = daysSinceLastObservation(child.id);
  const stale = days === null || days >= 7;

  return (
    <Link href={`/(app)/child/${child.id}`} asChild>
      <Pressable
        style={({ pressed }) => ({
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: stale ? "#fbbf24" : "#fde68a",
          backgroundColor: stale ? "#fffbeb" : "white",
          padding: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#f0a038",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{child.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#78350f" }}>
              {child.firstName} {child.lastName}
            </Text>
            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              Age {getAge(child.dateOfBirth)} · DOB {formatDate(child.dateOfBirth)}
            </Text>
          </View>
          {stale && days !== null && (
            <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <Text style={{ color: "#92400e", fontSize: 10, fontWeight: "700" }}>{days}d</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#b45309" }}>{observationCount}</Text>
            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: -2 }}>
              {observationCount === 1 ? "observation" : "observations"}
            </Text>
          </View>
          {isReportReady ? (
            <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#15803d" }}>✓ Report ready</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ height: 6, width: 56, borderRadius: 3, backgroundColor: "#fef3c7" }}>
                <View
                  style={{ height: 6, borderRadius: 3, backgroundColor: "#f0a038", width: `${progressPercent}%` }}
                />
              </View>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>{5 - observationCount} more</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}
