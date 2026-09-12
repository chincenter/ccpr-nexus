"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateHazardStatus, archiveHazard } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"mine_action_status">[] = ["open", "in_progress", "cleared", "monitoring", "closed"];

type Hazard = Tables<"mine_hazards"> & {
  project?: { name: string } | null;
  programme?: { name: string } | null;
  location?: { name: string } | null;
  mine_hazard_coordinates: Pick<Tables<"mine_hazard_coordinates">, "precise_lat" | "precise_lng"> | null;
};

export function HazardRow({ hazard, canEdit }: { hazard: Hazard; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(hazard.status);
  const precise = hazard.mine_hazard_coordinates;

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{hazard.hazard_code}</p>
        <p className="text-xs text-slate-500">
          {hazard.project?.name ?? hazard.programme?.name} · {hazard.hazard_type} · {hazard.location?.name ?? "No location"}
        </p>
        {hazard.description && <p className="mt-1 text-xs text-slate-500">{hazard.description}</p>}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={hazard.risk_level} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={hazard.verification_status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {precise ? (
          <span title="Precise coordinates — visible to you because you have field access to this record">
            {precise.precise_lat?.toFixed(5)}, {precise.precise_lng?.toFixed(5)}
          </span>
        ) : hazard.generalized_lat != null ? (
          <span title="Generalized to roughly 1km — precise coordinates are restricted to field staff and admins">
            ~{hazard.generalized_lat?.toFixed(2)}, {hazard.generalized_lng?.toFixed(2)}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"mine_action_status">;
              setStatus(next);
              startTransition(async () => {
                await updateHazardStatus(hazard.id, next);
                router.refresh();
              });
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <StatusBadge status={hazard.status} />
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await archiveHazard(hazard.id, !hazard.archived_at);
                router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {hazard.archived_at ? "Restore" : "Archive"}
          </button>
        </td>
      )}
    </tr>
  );
}
