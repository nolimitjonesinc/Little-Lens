"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function Redirector() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const childId = params.get("childId");
    router.replace(childId ? `/quick-capture/${childId}` : "/quick-capture");
  }, [params, router]);
  return <div className="p-8 text-center text-sage-600">Redirecting...</div>;
}

export default function CaptureRedirect() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sage-600">Loading...</div>}>
      <Redirector />
    </Suspense>
  );
}
