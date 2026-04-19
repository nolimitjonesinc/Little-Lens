import { View, Text } from "react-native";
import { Observation } from "../lib/types";
import { formatDate } from "../lib/utils";
import DomainTag from "./DomainTag";

interface ObservationItemProps {
  observation: Observation;
}

export default function ObservationItem({ observation }: ObservationItemProps) {
  return (
    <View className="rounded-lg border border-amber-100 bg-white p-4 mb-3">
      <Text className="text-sm text-gray-800 leading-5">
        {observation.cleanedObservation}
      </Text>

      <Text className="mt-2 text-xs text-sage-500">
        {formatDate(observation.createdAt)}
      </Text>

      {observation.tags && observation.tags.length > 0 && (
        <View className="mt-3 flex-row flex-wrap">
          {observation.tags.map((tag, index) => (
            <DomainTag key={index} tag={tag} />
          ))}
        </View>
      )}
    </View>
  );
}
