import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET = "observation-photos";

async function toBlob(uri: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Convert base64 → ArrayBuffer
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { data: bytes.buffer, contentType: "image/jpeg" };
  } catch {
    const res = await fetch(uri);
    const blob = await res.blob();
    const buffer = await new Response(blob).arrayBuffer();
    return { data: buffer, contentType: blob.type || "image/jpeg" };
  }
}

export async function uploadObservationPhoto(
  childId: string,
  localUri: string
): Promise<{ publicUrl: string | null; localUri: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return { publicUrl: null, localUri };
    }

    const { data, contentType } = await toBlob(localUri);
    const filename = `${childId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, data, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.warn("Photo upload failed (bucket may not exist yet):", uploadError.message);
      return { publicUrl: null, localUri };
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return { publicUrl: urlData.publicUrl, localUri };
  } catch (e) {
    console.warn("Photo upload error:", e);
    return { publicUrl: null, localUri };
  }
}
