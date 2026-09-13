"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTeamMember, removeTeamMember } from "@/app/(app)/projects/[id]/actions";

const ROLE_SUGGESTIONS = [
  "field_assistant",
  "finance_focal_point",
  "meal_focal_point",
  "project_assistant",
  "logistics_focal_point",
  "team_member",
];

export function NewTeamMemberForm({
  projectId,
  staff,
}: {
  projectId: string;
  staff: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-teal-700 hover:underline"
      >
        + Add Team Member
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await addTeamMember(projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="mt-2 grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-3"
    >
      <select name="staff_id" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Select staff member…</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name}
          </option>
        ))}
      </select>
      <input
        name="role_on_project"
        list="role-on-project-suggestions"
        placeholder="Role on project (e.g. field_assistant)"
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
      />
      <datalist id="role-on-project-suggestions">
        {ROLE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Add to team"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TeamMemberRow({
  projectId,
  staffId,
  fullName,
  jobTitle,
  roleOnProject,
  isActive,
  canEdit,
}: {
  projectId: string;
  staffId: string;
  fullName: string;
  jobTitle: string | null;
  roleOnProject: string;
  isActive: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex items-start justify-between gap-2 px-4 py-2 text-sm">
      <div>
        <p className="text-slate-800">
          {fullName}
          {!isActive && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Inactive
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {jobTitle ? `${jobTitle} · ` : ""}
          {roleOnProject.replaceAll("_", " ")}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      {canEdit && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await removeTeamMember(projectId, staffId);
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
          className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-700 disabled:opacity-60"
        >
          Remove
        </button>
      )}
    </li>
  );
}
