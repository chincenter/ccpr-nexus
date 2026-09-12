"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReferral } from "./actions";

const AGE_GROUPS = ["child", "youth", "adult", "elderly"];

export function ReferralForm({
  projects,
  facilities,
}: {
  projects: { id: string; name: string }[];
  facilities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Log referral
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createReferral(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <select name="project_id" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select name="facility_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">No linked facility</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <input name="referral_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="reason" placeholder="Reason for referral" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2" />
      <input name="referred_to" placeholder="Referred to" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="age_group" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Age group (optional)</option>
        {AGE_GROUPS.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <input name="gender" placeholder="Gender (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save referral"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
