"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaff } from "./actions";

const ROLES = [
  "viewer",
  "project_assistant",
  "project_officer",
  "me_meal",
  "finance",
  "programme_manager",
  "executive",
  "super_admin",
];

export function NewStaffForm() {
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
        + Add staff
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createStaff(formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600">Full name</label>
        <input name="full_name" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Job title</label>
        <input name="job_title" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">System role</label>
        <select name="system_role" defaultValue="viewer" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save staff record"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      <p className="col-span-full text-xs text-slate-500">
        They can then create their own login at <code>/login/register</code> using this exact email —
        it will link to this staff record and role automatically.
      </p>
    </form>
  );
}
