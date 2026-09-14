"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHazard, setHazardCoordinates, archiveHazard } from "../actions";
import type { Enums, Tables } from "@/lib/types/database";

const TYPES: Enums<"hazard_type">[] = ["landmine", "uxo", "other_explosive", "unknown"];
const RISK_LEVELS: Enums<"risk_level">[] = ["low", "medium", "high"];

export function HazardEditForm({
  hazard,
  locations,
  canEdit,
  canSeeCoordinates,
  precise,
}: {
  hazard: Tables<"mine_hazards">;
  locations: { id: string; name: string }[];
  canEdit: boolean;
  canSeeCoordinates: boolean;
  precise: { precise_lat: number | null; precise_lng: number | null } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState(precise?.precise_lat != null ? String(precise.precise_lat) : "");
  const [lng, setLng] = useState(precise?.precise_lng != null ? String(precise.precise_lng) : "");

  if (!canEdit) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {editing ? (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await updateHazard(hazard.id, formData);
              if (result.error) setError(result.error);
              else {
                setEditing(false);
                router.refresh();
              }
            });
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <select name="hazard_type" defaultValue={hazard.hazard_type} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="risk_level" defaultValue={hazard.risk_level} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select name="location_id" defaultValue={hazard.location_id ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Unspecified location</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <input name="date_identified" type="date" required defaultValue={hazard.date_identified} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <input name="source" defaultValue={hazard.source ?? ""} placeholder="Source" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" />
          <textarea name="description" rows={2} defaultValue={hazard.description ?? ""} placeholder="Description" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" />
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-teal-700 hover:underline">
            Edit hazard
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveHazard(hazard.id, !hazard.archived_at); router.refresh(); })}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {hazard.archived_at ? "Restore hazard" : "Archive hazard"}
          </button>
        </div>
      )}

      {canSeeCoordinates && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Precise coordinates — visible only to authorised field staff and admins
          </p>
          <form
            action={() => {
              setError(null);
              if (!lat || !lng) return;
              startTransition(async () => {
                const result = await setHazardCoordinates(hazard.id, hazard.project_id ?? undefined, Number(lat), Number(lng));
                if (result.error) setError(result.error);
                else router.refresh();
              });
            }}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <input value={lat} onChange={(e) => setLat(e.target.value)} type="number" step="any" placeholder="Latitude" className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input value={lng} onChange={(e) => setLng(e.target.value)} type="number" step="any" placeholder="Longitude" className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              Save coordinates
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </form>
        </div>
      )}
    </div>
  );
}
