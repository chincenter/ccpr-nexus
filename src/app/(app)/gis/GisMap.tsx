"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  layer: "projects" | "humanitarian" | "mine_action" | "health" | "governance";
  lat: number;
  lng: number;
  label: string;
  detail: string;
  href: string;
  severity?: "warning" | "critical";
};

const LAYER_META: Record<MapMarker["layer"], { label: string; color: string }> = {
  projects: { label: "Projects", color: "#0f766e" },
  humanitarian: { label: "Humanitarian", color: "#2563eb" },
  mine_action: { label: "Landmine / Mine Action", color: "#dc2626" },
  health: { label: "Health", color: "#16a34a" },
  governance: { label: "Governance", color: "#9333ea" },
};

const CHIN_STATE_CENTER: [number, number] = [22.9, 93.55];

export function GisMap({ markers }: { markers: MapMarker[] }) {
  const [activeLayers, setActiveLayers] = useState<Set<MapMarker["layer"]>>(
    () => new Set(Object.keys(LAYER_META) as MapMarker["layer"][]),
  );

  const visibleMarkers = useMemo(() => markers.filter((m) => activeLayers.has(m.layer)), [markers, activeLayers]);

  function toggleLayer(layer: MapMarker["layer"]) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3">
        {(Object.keys(LAYER_META) as MapMarker["layer"][]).map((layer) => {
          const meta = LAYER_META[layer];
          const count = markers.filter((m) => m.layer === layer).length;
          return (
            <label key={layer} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={activeLayers.has(layer)}
                onChange={() => toggleLayer(layer)}
                className="rounded border-slate-300"
              />
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label} ({count})
            </label>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200" style={{ height: "60vh", minHeight: 400 }}>
        <MapContainer center={CHIN_STATE_CENTER} zoom={8} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visibleMarkers.map((m, i) => (
            <CircleMarker
              key={i}
              center={[m.lat, m.lng]}
              radius={m.severity === "critical" ? 9 : 7}
              pathOptions={{
                color: LAYER_META[m.layer].color,
                fillColor: LAYER_META[m.layer].color,
                fillOpacity: 0.7,
                weight: m.severity ? 3 : 1,
              }}
            >
              <Popup>
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-slate-500">{m.detail}</p>
                <Link href={m.href} className="text-xs font-medium text-teal-700 hover:underline">
                  Open →
                </Link>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {markers.length === 0 && (
        <p className="text-sm text-slate-500">No locations with coordinates recorded yet.</p>
      )}
    </div>
  );
}
