"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { updateReferralStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"case_status">[] = ["open", "in_progress", "resolved", "closed"];

type Referral = Tables<"health_referrals"> & { project?: { name: string } | null; facility?: { name: string } | null };

export function ReferralRow({ referral, canEdit }: { referral: Referral; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(referral.status);

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">{referral.project?.name ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{referral.referral_date}</td>
      <td className="px-4 py-3 text-slate-600">{referral.reason ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{referral.referred_to ?? "—"}</td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value as Enums<"case_status">;
              setStatus(next);
              startTransition(async () => {
                await updateReferralStatus(referral.id, next);
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
          <StatusBadge status={referral.status} />
        )}
      </td>
    </tr>
  );
}
