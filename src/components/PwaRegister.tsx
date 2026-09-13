"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-critical: the app works fully without it, just without
        // the offline fallback page and static-asset caching.
      });
    }
  }, []);

  return null;
}
