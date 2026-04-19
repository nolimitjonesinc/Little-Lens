import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#faf7f2",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 48,
          fontFamily: "Georgia",
          color: "#f0a038",
        }}
      >
        LittleLens
      </Text>
    </View>
  );
}
