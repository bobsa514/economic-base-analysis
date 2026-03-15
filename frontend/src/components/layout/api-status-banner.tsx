"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Status = "checking" | "connected" | "slow" | "unavailable";

/**
 * Shows a slim banner when the backend is cold-starting (Railway free tier sleeps).
 * - Fires a /health check on mount.
 * - After 2 s of waiting, shows a "Connecting..." banner.
 * - Once the health check succeeds the banner auto-dismisses.
 * - If 30 s pass without a response, shows an "unavailable" error banner.
 */
export default function ApiStatusBanner() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const abortController = new AbortController();

    // Show "connecting" banner only if the health check takes > 2 seconds
    const slowTimer = setTimeout(() => setStatus("slow"), 2000);

    fetch(`${apiUrl}/health`, { signal: abortController.signal })
      .then((res) => {
        clearTimeout(slowTimer);
        if (res.ok) {
          setStatus("connected");
        } else {
          setStatus("unavailable");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setStatus("unavailable");
        }
      });

    // Give up after 30 seconds
    const failTimer = setTimeout(() => {
      abortController.abort();
      setStatus("unavailable");
    }, 30000);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(failTimer);
      abortController.abort();
    };
  }, []);

  // Don't render anything while still in initial fast check or once connected
  if (status === "connected" || status === "checking") return null;

  const isSlow = status === "slow";

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-center text-sm transition-all duration-300 ${
        isSlow
          ? "bg-blue-50 text-blue-600"
          : "bg-red-50 text-red-600"
      }`}
    >
      {isSlow ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Connecting to data server...</span>
        </>
      ) : (
        <span>Data server unavailable. Some features may not work.</span>
      )}
    </div>
  );
}
