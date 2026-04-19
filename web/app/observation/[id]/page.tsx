"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyObservationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/quick-capture");
  }, [router]);
  return <div className="p-8 text-center text-sage-600">Redirecting to Quick Capture...</div>;
}
