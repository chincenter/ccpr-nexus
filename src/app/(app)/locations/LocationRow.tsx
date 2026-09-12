"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveLocation } from "./actions";
import type { Tables } from "@/lib/types/database";

export function LocationRow({
  location,
  canEdit,
  isArchived,
}: {
  location: Tables<"locations">;
  canEdit: boolean;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const area = [location.village, location.township, location.district, location.state_region]
    .filter(Boolean)
    .join(", ");

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2 font-medium text-slate-900">{location.name}</td>
      <td className="px-4 py-2 capitalize text-slate-600">{location.location_type.replaceAll("_", " ")}</td>
      <td className="px-4 py-2 text-slate-600">{area || "—"}</td>
      {canEdit && (
        <td className="px-4 py-2 text-right">
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
        </td>
      )}
    </tr>
  );
}
