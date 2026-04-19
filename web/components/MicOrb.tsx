"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Stage = "idle" | "listening" | "heard" | "pausing" | "done";

interface Props {
  onFinal: (transcript: string) => void;
  onCancel: () => void;
  autoStart?: boolean;
  silenceMs?: number;
}

export function MicOrb({ onFinal, onCancel, autoStart = true, silenceMs = 2500 }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const finalTextRef = useRef<string>("");
  const stoppedRef = useRef<boolean>(false);

  useEffect(() => {
    if (autoStart) void start();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    stoppedRef.current = false;
    setError(null);
    setFinalText("");
    setInterim("");
    finalTextRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (stoppedRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setAudioLevel(avg);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setError("Microphone access denied. You can still type your note below.");
      setStage("idle");
      return;
    }

    const SR =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SR) {
      setError("Voice recognition isn't supported in this browser. Type your note below.");
      setStage("listening");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => setStage("listening");
    rec.onerror = (e: any) => {
      if (e?.error === "no-speech") return;
      setError(e?.error || "Recognition error");
    };
    rec.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        finalTextRef.current = (finalTextRef.current + " " + finalChunk).trim();
        setFinalText(finalTextRef.current);
      }
      setInterim(interimChunk);
      setStage("heard");
      scheduleSilenceSubmit();
    };
    rec.onend = () => {
      if (!stoppedRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch {}
  }

  function scheduleSilenceSubmit() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);
    setStage("heard");

    silenceTimerRef.current = setTimeout(() => {
      setStage("pausing");
      let remaining = 3;
      setCountdown(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          submit();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }, silenceMs);
  }

  function submit() {
    const text = finalTextRef.current.trim();
    if (!text) {
      setStage("idle");
      return;
    }
    setStage("done");
    cleanup();
    onFinal(text);
  }

  function cancel() {
    cleanup();
    onCancel();
  }

  function cleanup() {
    stoppedRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    try { recognitionRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  const scale = 1 + audioLevel * 0.6;
  const statusLine = {
    idle: "Tap to start",
    listening: "Listening...",
    heard: "Got it — keep going or pause to save",
    pausing: `Saving in ${countdown}... (speak to continue)`,
    done: "Saved",
  }[stage];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-48 w-48 items-center justify-center">
        {(stage === "listening" || stage === "heard") && (
          <span className="pulse-ring absolute inset-0 rounded-full bg-amber-400/40" />
        )}
        <button
          type="button"
          onClick={() => (stage === "idle" ? start() : submit())}
          style={{ transform: `scale(${scale})` }}
          className={cn(
            "relative flex h-40 w-40 items-center justify-center rounded-full text-white shadow-xl transition-all",
            stage === "pausing" ? "bg-sage-500" : "bg-amber-500",
            stage === "listening" || stage === "heard" ? "soft-glow" : "",
          )}
          aria-label="Microphone"
        >
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor" aria-hidden>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
          </svg>
        </button>
      </div>

      <div className="min-h-[2rem] text-center">
        <p className={cn(
          "text-sm font-medium",
          stage === "pausing" ? "text-sage-700" : "text-amber-800",
        )}>
          {statusLine}
        </p>
      </div>

      <div className="w-full max-w-md min-h-[80px] rounded-2xl border border-sage-200 bg-white/80 p-4 text-center text-amber-900">
        {finalText || interim ? (
          <p className="text-base leading-relaxed">
            {finalText}
            {interim && <span className="text-sage-500 italic"> {interim}</span>}
          </p>
        ) : (
          <p className="text-sm text-sage-400">Your words will appear here...</p>
        )}
      </div>

      {error && (
        <p className="text-center text-sm text-amber-700 max-w-sm">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={cancel}
          className="rounded-full border border-sage-300 bg-white px-5 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
        >
          Cancel
        </button>
        {(finalText || interim) && (
          <button
            onClick={submit}
            className="rounded-full bg-sage-600 px-5 py-2 text-sm font-medium text-white hover:bg-sage-700"
          >
            Save now
          </button>
        )}
      </div>
    </div>
  );
}
