"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./GisMap";

// Leaflet touches `window` at import time, so it can only run in the
// browser. `ssr: false` is only permitted inside a Client Component,
// hence this thin wrapper around the actual map.
const GisMap = dynamic(() => import("./GisMap").then((m) => m.GisMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] min-h-[400px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export function GisMapLoader({ markers }: { markers: MapMarker[] }) {
  return <GisMap markers={markers} />;
}
