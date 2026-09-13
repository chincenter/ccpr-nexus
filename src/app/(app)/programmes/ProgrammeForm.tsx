"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProgramme } from "./actions";

const CATEGORIES = ["humanitarian", "mine_action", "health", "governance", "peacebuilding", "research_policy", "other"];
const STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];

export function ProgrammeForm({ staff }: { staff: { id: string; full_name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
      >
        + New Programme
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createProgramme(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600">Programme code</label>
        <input name="code" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="lg:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Programme name</label>
        <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Category</label>
        <select name="category" defaultValue="humanitarian" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Programme lead</label>
        <select name="lead_staff_id" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Status</label>
        <select name="status" defaultValue="planning" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Start date</label>
        <input name="start_date" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">End date</label>
        <input name="end_date" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Description</label>
        <textarea name="description" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save programme"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
