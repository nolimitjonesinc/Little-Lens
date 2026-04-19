import { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

export default function ScanEntry() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Please allow camera access in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImage(result.assets[0].uri, result.assets[0].mimeType || "image/jpeg");
    }
  };

  const handlePickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos access needed", "Please allow photo library access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImage(result.assets[0].uri, result.assets[0].mimeType || "image/jpeg");
    }
  };

  const handleImage = async (uri: string, mimeType: string) => {
    setBusy(true);
    try {
      let base64: string;
      try {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {
        // Fallback: fetch + FileReader (works in Expo Go on iOS)
        const res = await fetch(uri);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] ?? result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // Pass base64 via global so we don't blow up the URL
      if (typeof global !== "undefined") {
        (global as any).__ll_pending_scan = { base64, mimeType, uri };
      }
      router.push("/(app)/scan/review");
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn't read image", "Try a different photo or smaller size.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf7f2" }} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#e8e0d5",
          backgroundColor: "white",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: "#6b7280", fontSize: 15 }}>← Back</Text>
        </Pressable>
        <Text style={{ color: "#78350f", fontSize: 16, fontWeight: "700" }}>Scan Notes</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            borderRadius: 24,
            backgroundColor: "white",
            padding: 24,
            borderWidth: 1,
            borderColor: "#e8e0d5",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#fef3c7",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="document-text" size={36} color="#d97706" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#78350f", textAlign: "center" }}>
              Turn paper notes into observations
            </Text>
            <Text
              style={{ fontSize: 13, color: "#6b7280", textAlign: "center", marginTop: 8, lineHeight: 19 }}
            >
              Snap your clipboard page. AI splits it into a note per child — you review, confirm, save all.
            </Text>
          </View>

          <Pressable
            onPress={handleTakePhoto}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: "#f0a038",
              padding: 18,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="camera" size={28} color="white" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Take a photo</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>
                Use the camera to capture your page
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>

          <Pressable
            onPress={handlePickFromLibrary}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 10,
              backgroundColor: "white",
              padding: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e8e0d5",
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Ionicons name="images-outline" size={28} color="#6b7280" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#78350f", fontWeight: "700", fontSize: 16 }}>
                Choose from library
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                Pick an existing photo
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
          </Pressable>

          {busy && (
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <ActivityIndicator color="#f0a038" />
              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>Reading image...</Text>
            </View>
          )}
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: "#f6f8f6",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <Text style={{ fontWeight: "700", color: "#65835b", marginBottom: 4, fontSize: 13 }}>
            💡 Tips for best results
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 12, lineHeight: 18 }}>
            • Lay the paper flat, good lighting{"\n"}
            • Include all names and notes in the frame{"\n"}
            • Write one child&apos;s name per line: &ldquo;Maya — sorted blocks&rdquo;
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
