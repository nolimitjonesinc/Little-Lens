"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
          await videoRef.current.play();
        }
      } catch (e) {
        setError("Camera unavailable. Upload a photo instead.");
      }
    }
    start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    if (!videoRef.current || !ready) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    onCapture(dataUrl);
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-sm text-sage-200">{error}</p>
        <label className="cursor-pointer rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600">
          Upload a photo
          <input type="file" accept="image/*" capture="environment" onChange={onUpload} className="hidden" />
        </label>
        <button onClick={onCancel} className="mt-4 text-sm text-sage-300 underline">Cancel</button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      {flash && <div className="absolute inset-0 bg-white opacity-80 transition-opacity" />}

      {/* Doc frame guide */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="h-full w-full rounded-xl border-2 border-white/50 border-dashed" />
      </div>

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <button
          onClick={onCancel}
          className="rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur"
        >
          ← Cancel
        </button>
        <div className="rounded-full bg-black/60 px-4 py-2 text-xs text-white backdrop-blur">
          Fit the whole page inside the frame
        </div>
        <label className="cursor-pointer rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
          📎
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-8">
        <button
          onClick={capture}
          disabled={!ready}
          className="h-20 w-20 rounded-full bg-white shadow-xl ring-4 ring-white/40 transition-transform active:scale-95 disabled:opacity-50"
          aria-label="Capture"
        >
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-amber-500 bg-amber-500" />
        </button>
      </div>
    </div>
  );
}
