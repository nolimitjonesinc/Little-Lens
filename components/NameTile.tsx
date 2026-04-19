import { View, Text, Pressable } from "react-native";
import { Child } from "../lib/types";

interface Props {
  child: Child;
  observationCount: number;
  daysSinceLast: number | null;
  onPress: () => void;
}

export default function NameTile({ child, observationCount, daysSinceLast, onPress }: Props) {
  const stale = daysSinceLast === null || daysSinceLast >= 7;
  const fresh = daysSinceLast !== null && daysSinceLast <= 1;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: stale ? "#fbbf24" : "#e8e0d5",
        backgroundColor: stale ? "#fef9e7" : "white",
        padding: 14,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#f0a038",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{child.initials}</Text>
        </View>

        {fresh ? (
          <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ color: "#15803d", fontSize: 10, fontWeight: "600" }}>✓ today</Text>
          </View>
        ) : stale && daysSinceLast !== null ? (
          <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ color: "#92400e", fontSize: 10, fontWeight: "600" }}>{daysSinceLast}d</Text>
          </View>
        ) : stale ? (
          <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ color: "#92400e", fontSize: 10, fontWeight: "600" }}>new</Text>
          </View>
        ) : null}
      </View>

      <View>
        <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: "700", color: "#78350f" }}>
          {child.firstName}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
          {child.lastName}
        </Text>
        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
          {observationCount} {observationCount === 1 ? "note" : "notes"}
        </Text>
      </View>
    </Pressable>
  );
}
