import { Pressable, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export default function MicButton({ isRecording, onPress }: MicButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isRecording, scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={{
          height: 128,
          width: 128,
          borderRadius: 64,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0a038",
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Ionicons
          name={isRecording ? "stop" : "mic"}
          size={64}
          color="white"
        />
      </Animated.View>
    </Pressable>
  );
}
