"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { archiveLocation, updateLocation } from "./actions";
import type { Tables } from "@/lib/types/database";

export function LocationRow({
  location,
  canEdit,
  isArchived,
  locationTypes,
  linkedProjects,
  linkedActivities,
}: {
  location: Tables<"locations">;
  canEdit: boolean;
  isArchived: boolean;
  locationTypes: readonly string[];
  linkedProjects: { id: string; name: string }[];
  linkedActivities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const area = [location.village, location.township, location.district, location.state_region]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-2 font-medium text-slate-900">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left hover:text-teal-800 hover:underline">
            {location.name}
          </button>
          {location.is_sensitive && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Sensitive
            </span>
          )}
        </td>
        <td className="px-4 py-2 capitalize text-slate-600">{location.location_type.replaceAll("_", " ")}</td>
        <td className="px-4 py-2 text-slate-600">{area || "—"}</td>
        <td className="px-4 py-2 text-slate-600">
          {linkedProjects.length} project{linkedProjects.length === 1 ? "" : "s"} · {linkedActivities.length} activit
          {linkedActivities.length === 1 ? "y" : "ies"}
        </td>
        {canEdit && (
          <td className="px-4 py-2 text-right">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditing((v) => !v);
                  setExpanded(true);
                }}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await archiveLocation(location.id, !isArchived);
                    router.refresh();
                  })
                }
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
              >
                {isArchived ? "Restore" : "Archive"}
              </button>
            </div>
          </td>
        )}
      </tr>
      {expanded && (
        <tr className="bg-slate-50/60">
          <td colSpan={canEdit ? 5 : 4} className="px-4 py-3">
            {editing ? (
              <form
                action={(formData) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await updateLocation(location.id, formData);
                    if (result.error) setError(result.error);
                    else {
                      setEditing(false);
                      router.refresh();
                    }
                  });
                }}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600">Name</label>
                  <input name="name" defaultValue={location.name} required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Type</label>
                  <select name="location_type" defaultValue={location.location_type} required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                    {locationTypes.map((t) => (
                      <option key={t} value={t}>
                        {t.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">State/Region</label>
                  <input name="state_region" defaultValue={location.state_region ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">District</label>
                  <input name="district" defaultValue={location.district ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Township</label>
                  <input name="township" defaultValue={location.township ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Village (optional)</label>
                  <input name="village" defaultValue={location.village ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Latitude (optional)</label>
                  <input name="latitude" type="number" step="any" defaultValue={location.lat ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Longitude (optional)</label>
                  <input name="longitude" type="number" step="any" defaultValue={location.lng ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-medium text-slate-600">Notes (optional)</label>
                  <textarea name="notes" rows={2} defaultValue={location.notes ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                </div>

                {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

                <div className="col-span-full flex gap-2">
                  <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                    {isPending ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                {location.notes && <p className="text-slate-700">{location.notes}</p>}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Projects</p>
                  {linkedProjects.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {linkedProjects.map((p) => (
                        <li key={p.id}>
                          <Link href={`/projects/${p.id}`} className="rounded-full bg-white px-2 py-1 text-xs text-teal-800 ring-1 ring-slate-200 hover:underline">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No projects linked to this location yet.</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Activities</p>
                  {linkedActivities.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {linkedActivities.map((a) => (
                        <li key={a.id}>
                          <Link href={`/activities/${a.id}`} className="rounded-full bg-white px-2 py-1 text-xs text-teal-800 ring-1 ring-slate-200 hover:underline">
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No activities at this location yet.</p>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
