"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import {
  createDistributionItem,
  archiveDistributionItem,
  updateDistributionItem,
  updateDistribution,
  updateDistributionStatus,
  archiveDistribution,
} from "../actions";
import type { Enums, Tables } from "@/lib/types/database";

type Document = Tables<"documents"> & { uploader?: { full_name: string } | null };

const TYPES = ["food", "nfi", "cash", "shelter", "wash", "protection", "livelihood", "other"];
const STATUSES: Enums<"distribution_status">[] = ["planned", "in_progress", "completed", "cancelled", "verified"];

type Item = Tables<"distribution_items"> & {
  household?: { household_code: string } | null;
  beneficiary?: { beneficiary_code: string } | null;
};
type Distribution = Tables<"distributions"> & {
  distribution_items: Item[];
  assistance_plan?: { name: string } | null;
  location?: { name: string } | null;
};

function ItemRow({ projectId, item, canEdit }: { projectId: string; item: Item; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [editing, setEditing] = useState(false);

  return (
    <tr className={item.archived_at ? "opacity-50" : undefined}>
      <td className="py-1 pr-3">{item.household?.household_code ?? item.beneficiary?.beneficiary_code ?? "—"}</td>
      <td className="py-1 pr-3">
        {editing ? (
          <input
            type="number"
            min={0}
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 rounded-md border border-slate-300 px-1 py-0.5"
          />
        ) : (
          item.quantity
        )}
      </td>
      {canEdit && (
        <td className="py-1 pr-3 space-x-2 whitespace-nowrap text-right">
          {editing ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateDistributionItem(projectId, item.id, Number(quantity));
                    setEditing(false);
                    router.refresh();
                  })
                }
                className="text-teal-700 hover:underline disabled:opacity-60"
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-slate-500 hover:underline">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className="text-teal-700 hover:underline">
                Edit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await archiveDistributionItem(projectId, item.id, !item.archived_at);
                    router.refresh();
                  })
                }
                className="text-slate-400 hover:text-red-600 disabled:opacity-60"
              >
                {item.archived_at ? "Restore" : "Remove"}
              </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
}

export function DistributionCard({
  projectId,
  distribution,
  households,
  canEdit,
  canVerify,
  documents = [],
}: {
  projectId: string;
  distribution: Distribution;
  households: { id: string; household_code: string }[];
  canEdit: boolean;
  canVerify: boolean;
  documents?: Document[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(distribution.status);
  const [error, setError] = useState<string | null>(null);

  const activeItems = distribution.distribution_items.filter((i) => !i.archived_at);
  const totalQuantity = activeItems.reduce((sum, i) => sum + Number(i.quantity), 0);
  const uniqueHouseholds = new Set(activeItems.map((i) => i.household_id).filter(Boolean)).size;
  const uniqueBeneficiaries = new Set(activeItems.map((i) => i.beneficiary_id).filter(Boolean)).size;

  function setDistributionStatus(next: Enums<"distribution_status">) {
    setStatus(next);
    startTransition(async () => {
      const result = await updateDistributionStatus(projectId, distribution.id, next);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4" open={editing || undefined}>
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {distribution.assistance_type} — {distribution.distribution_date}
          </p>
          <p className="text-xs text-slate-500">
            {distribution.assistance_plan?.name ?? "No linked plan"} · {distribution.location?.name ?? "No location"} ·{" "}
            {totalQuantity} {distribution.unit ?? ""} · {uniqueHouseholds} unique household{uniqueHouseholds === 1 ? "" : "s"}
            {uniqueBeneficiaries > 0 && <> · {uniqueBeneficiaries} unique beneficiaries</>}
            {" "}({activeItems.length} record{activeItems.length === 1 ? "" : "s"})
          </p>
        </div>
        <StatusBadge status={distribution.status} />
      </summary>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={status}
              disabled={isPending}
              onChange={(e) => setDistributionStatus(e.target.value as Enums<"distribution_status">)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              {STATUSES.filter((s) => s !== "verified" || canVerify || distribution.status === "verified").map((s) => (
                <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
              ))}
            </select>
            {canVerify && distribution.status === "completed" && (
              <button type="button" disabled={isPending} onClick={() => setDistributionStatus("verified")} className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60">
                Verify
              </button>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        )}

        {editing ? (
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await updateDistribution(projectId, distribution.id, formData);
                if (result.error) setError(result.error);
                else {
                  setEditing(false);
                  router.refresh();
                }
              });
            }}
            className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-3"
          >
            <input name="distribution_date" type="date" required defaultValue={distribution.distribution_date} className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <select name="assistance_type" defaultValue={distribution.assistance_type} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input name="unit" defaultValue={distribution.unit ?? ""} placeholder="Unit" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
            <input name="notes" defaultValue={distribution.notes ?? ""} placeholder="Notes" className="sm:col-span-2 rounded-md border border-slate-300 px-2 py-1 text-xs" />
            {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
            <div className="col-span-full flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          distribution.notes && <p className="text-xs text-slate-500">{distribution.notes}</p>
        )}

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
              <ItemRow key={item.id} projectId={projectId} item={item} canEdit={canEdit} />
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

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidence — distribution list, photos</p>
          <div className="mt-1 space-y-2">
            {canEdit && <DocumentUploader entityType="distribution" entityId={distribution.id} />}
            <DocumentList documents={documents} canEdit={canEdit} />
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
              Edit distribution
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await archiveDistribution(projectId, distribution.id, !distribution.archived_at);
                  router.refresh();
                })
              }
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
            >
              {distribution.archived_at ? "Restore distribution" : "Archive distribution"}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
