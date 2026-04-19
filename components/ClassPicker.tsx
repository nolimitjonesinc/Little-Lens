import { ScrollView, Text, Pressable } from "react-native";
import { ClassRoom } from "../lib/types";

interface Props {
  classes: ClassRoom[];
  activeClassId: string;
  onSelect: (classId: string) => void;
}

export default function ClassPicker({ classes, activeClassId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {classes.map((c) => {
        const active = c.id === activeClassId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? "#f0a038" : "#e8e0d5",
              backgroundColor: active ? "#f0a038" : "white",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "white" : "#6b7280" }}>
              {c.emoji}  {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
