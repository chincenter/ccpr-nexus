"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProgramme, archiveProgramme } from "../actions";
import type { Tables } from "@/lib/types/database";

const CATEGORIES = ["humanitarian", "mine_action", "health", "governance", "peacebuilding", "research_policy", "other"];
const STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];

export function ProgrammeEditForm({
  programme,
  staff,
}: {
  programme: Tables<"programmes">;
  staff: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit Programme
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await archiveProgramme(programme.id, !programme.archived_at);
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {programme.archived_at ? "Restore" : "Archive"}
        </button>
        {error && <p className="self-center text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateProgramme(programme.id, formData);
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
        <input name="code" defaultValue={programme.code} required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="lg:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Programme name</label>
        <input name="name" defaultValue={programme.name} required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Category</label>
        <select name="category" defaultValue={programme.category} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Programme lead</label>
        <select name="lead_staff_id" defaultValue={programme.lead_staff_id ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Status</label>
        <select name="status" defaultValue={programme.status} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Start date</label>
        <input name="start_date" type="date" defaultValue={programme.start_date ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">End date</label>
        <input name="end_date" type="date" defaultValue={programme.end_date ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="lg:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Description</label>
        <textarea name="description" defaultValue={programme.description ?? ""} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
