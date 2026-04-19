import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#faf7f2" },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="child/[id]" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="observation/review" />
      <Stack.Screen name="report/[childId]" />
      <Stack.Screen name="quick-capture" />
      <Stack.Screen name="quick-capture/[childId]" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="scan/review" />
    </Stack>
  );
}
