"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { createService, archiveFacility } from "./actions";
import type { Tables } from "@/lib/types/database";

type Facility = Tables<"health_facilities"> & {
  health_services: Tables<"health_services">[];
  location?: { name: string } | null;
};

export function FacilityCard({ facility, canEdit }: { facility: Facility; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{facility.name}</p>
          <p className="text-xs text-slate-500">
            {facility.facility_type} · {facility.location?.name ?? "No location"} · {facility.health_services.length} service{facility.health_services.length === 1 ? "" : "s"}
          </p>
        </div>
        <StatusBadge status={facility.status} />
      </summary>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {(facility.contact_person || facility.contact_phone) && (
          <p className="text-xs text-slate-500">
            {facility.contact_person} {facility.contact_phone && `· ${facility.contact_phone}`}
          </p>
        )}

        <ul className="list-inside list-disc text-xs text-slate-600">
          {facility.health_services.map((s) => (
            <li key={s.id}>
              {s.service_type}
              {s.description && ` — ${s.description}`}
            </li>
          ))}
        </ul>
        {facility.health_services.length === 0 && <p className="text-xs text-slate-500">No services listed yet.</p>}

        {canEdit && (
          <div>
            {!addOpen ? (
              <button type="button" onClick={() => setAddOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
                + Add service
              </button>
            ) : (
              <form
                action={(formData) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createService(facility.id, formData);
                    if (result.error) setError(result.error);
                    else {
                      setAddOpen(false);
                      router.refresh();
                    }
                  });
                }}
                className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2"
              >
                <input name="service_type" placeholder="Service type" required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
                <input name="description" placeholder="Description (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
                <div className="col-span-full flex gap-2">
                  <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                    Save
                  </button>
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                    Cancel
                  </button>
                </div>
                {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
              </form>
            )}
          </div>
        )}

        {canEdit && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveFacility(facility.id, !facility.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {facility.archived_at ? "Restore facility" : "Archive facility"}
          </button>
        )}
      </div>
    </details>
  );
}
