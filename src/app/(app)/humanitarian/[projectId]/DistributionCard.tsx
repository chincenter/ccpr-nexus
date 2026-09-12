"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDistributionItem, deleteDistributionItem } from "../actions";
import type { Tables } from "@/lib/types/database";

type Item = Tables<"distribution_items"> & {
  household?: { household_code: string } | null;
  beneficiary?: { beneficiary_code: string } | null;
};
type Distribution = Tables<"distributions"> & {
  distribution_items: Item[];
  assistance_plan?: { name: string } | null;
  location?: { name: string } | null;
};

export function DistributionCard({
  projectId,
  distribution,
  households,
  canEdit,
}: {
  projectId: string;
  distribution: Distribution;
  households: { id: string; household_code: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuantity = distribution.distribution_items.reduce((sum, i) => sum + Number(i.quantity), 0);

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {distribution.assistance_type} — {distribution.distribution_date}
          </p>
          <p className="text-xs text-slate-500">
            {distribution.assistance_plan?.name ?? "No linked plan"} · {distribution.location?.name ?? "No location"} ·{" "}
            {totalQuantity} {distribution.unit ?? ""} across {distribution.distribution_items.length} record{distribution.distribution_items.length === 1 ? "" : "s"}
          </p>
        </div>
      </summary>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {distribution.notes && <p className="text-xs text-slate-500">{distribution.notes}</p>}

        <table className="min-w-full text-xs">
          <thead className="text-left uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-1 pr-3">Recipient</th>
              <th className="py-1 pr-3">Quantity</th>
              {canEdit && <th className="py-1 pr-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {distribution.distribution_items.map((item) => (
              <tr key={item.id}>
                <td className="py-1 pr-3">{item.household?.household_code ?? item.beneficiary?.beneficiary_code ?? "—"}</td>
                <td className="py-1 pr-3">{item.quantity}</td>
                {canEdit && (
                  <td className="py-1 pr-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDistributionItem(projectId, item.id);
                          router.refresh();
                        })
                      }
                      className="text-slate-400 hover:text-red-600 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {distribution.distribution_items.length === 0 && <p className="text-xs text-slate-500">No recipients recorded yet.</p>}

        {canEdit && (
          <div>
            {!addOpen ? (
              <button type="button" onClick={() => setAddOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
                + Record recipient
              </button>
            ) : (
              <form
                action={(formData) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createDistributionItem(projectId, distribution.id, formData);
                    if (result.error) setError(result.error);
                    else {
                      setAddOpen(false);
                      router.refresh();
                    }
                  });
                }}
                className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-3"
              >
                <select name="household_id" required className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                  <option value="">Select household…</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>{h.household_code}</option>
                  ))}
                </select>
                <input name="quantity" type="number" min={0} step="0.01" placeholder="Quantity" required className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
                <div className="flex gap-2">
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
      </div>
    </details>
  );
}
