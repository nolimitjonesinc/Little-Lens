import { View, Text } from "react-native";
import { getDomainColor } from "../lib/theme";

interface DomainTagProps {
  tag: string;
}

export default function DomainTag({ tag }: DomainTagProps) {
  const color = getDomainColor(tag);

  return (
    <View
      className="mr-2 mb-2 rounded-full px-3 py-1"
      style={{ backgroundColor: `${color}20` }}
    >
      <Text className="text-xs font-medium" style={{ color }}>
        {tag}
      </Text>
    </View>
  );
}
