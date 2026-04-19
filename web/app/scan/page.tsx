"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";

export default function ScanPage() {
  const router = useRouter();
  const [showCamera, setShowCamera] = useState(false);

  function onCapture(dataUrl: string) {
    try {
      sessionStorage.setItem("scan:image", dataUrl);
      router.push("/scan/review");
    } catch {
      alert("That image is too large. Try a smaller photo.");
    }
  }

  if (showCamera) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <CameraCapture onCapture={onCapture} onCancel={() => setShowCamera(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/dashboard" className="text-sm text-sage-600 hover:text-amber-700">
            ← Back
          </Link>
          <h1 className="font-serif text-lg font-semibold text-amber-900">Scan Handwritten Notes</h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="rounded-3xl border border-sage-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl">
              📄
            </div>
            <h2 className="font-serif text-2xl font-semibold text-amber-900">
              Turn paper notes into observations
            </h2>
            <p className="mt-2 text-sm text-sage-600 max-w-md mx-auto">
              Snap a photo of your clipboard page. AI reads the handwriting and splits it into a note for each child — you just review and save.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-4 rounded-2xl bg-amber-500 p-5 text-left text-white shadow-lg transition-transform active:scale-[0.98]"
            >
              <span className="text-3xl">📷</span>
              <div className="flex-1">
                <div className="text-lg font-semibold">Take a photo</div>
                <div className="text-sm text-amber-50/90">Use the camera to capture your page</div>
              </div>
              <span className="text-2xl">→</span>
            </button>

            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-sage-300 bg-white p-5 text-left transition-colors hover:border-amber-400">
              <span className="text-3xl">📎</span>
              <div className="flex-1">
                <div className="text-lg font-semibold text-amber-900">Upload from files</div>
                <div className="text-sm text-sage-600">Choose an existing photo or image</div>
              </div>
              <span className="text-2xl text-sage-400">→</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => onCapture(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div className="mt-8 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700">
            <p className="font-semibold mb-1">💡 Tips for best results</p>
            <ul className="list-disc pl-5 space-y-1 text-sage-600">
              <li>Lay the paper flat on a solid surface</li>
              <li>Good lighting — natural daylight is best</li>
              <li>Include all the names and notes in the frame</li>
              <li>Write one child&apos;s name per line: &ldquo;Maya — sorted blocks&rdquo;</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
