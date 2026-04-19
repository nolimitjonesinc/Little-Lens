// Safe wrapper around expo-speech-recognition so the app doesn't crash
// when the native module isn't present in the installed dev build.

type SpeechModule = {
  requestPermissionsAsync: () => Promise<{ status: string }>;
  start: (opts: any) => void;
  stop: () => void;
};

let _module: SpeechModule | null = null;
let _hook: (event: string, fn: (e: any) => void) => void = () => {};
let _available = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("expo-speech-recognition");
  if (mod?.ExpoSpeechRecognitionModule) {
    _module = mod.ExpoSpeechRecognitionModule as SpeechModule;
    _hook = mod.useSpeechRecognitionEvent as typeof _hook;
    _available = true;
  }
} catch (e) {
  // Native module not linked in this build — fall back to text-only.
  console.warn("expo-speech-recognition unavailable; using text-only mode");
}

export const SpeechRecognition: SpeechModule = _module ?? {
  requestPermissionsAsync: async () => ({ status: "denied" }),
  start: () => {},
  stop: () => {},
};

export const useSpeechRecognitionEvent = _hook;
export const SPEECH_AVAILABLE = _available;
