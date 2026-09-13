"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createObjective,
  updateObjective,
  archiveObjective,
  createOutcome,
  updateOutcome,
  archiveOutcome,
  createOutput,
  updateOutput,
  archiveOutput,
  createActivity,
} from "@/app/(app)/projects/[id]/actions";
import type { Tables } from "@/lib/types/database";

const PRIORITIES = ["low", "medium", "high", "critical"];

// -----------------------------------------------------------------------
// Objective
// -----------------------------------------------------------------------

export function NewObjectiveForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
        + Add Objective
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createObjective(projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-4"
    >
      <input name="code" placeholder="Code (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="name" placeholder="Objective" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-4" />
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ObjectiveHeader({
  objective,
  projectId,
  canEdit,
}: {
  objective: Tables<"objectives">;
  projectId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Objective</p>
        <p className="font-medium text-slate-900">{objective.name}</p>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Objective {objective.code ? `(${objective.code})` : ""}</p>
          <p className="font-medium text-slate-900">{objective.name}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveObjective(objective.id, projectId, !objective.archived_at);
                if (result.error) setError(result.error);
                else router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {objective.archived_at ? "Restore" : "Archive"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateObjective(objective.id, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setEditing(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
    >
      <input name="code" defaultValue={objective.code ?? ""} placeholder="Code" className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
      <input name="name" defaultValue={objective.name} required className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-3" />
      <textarea name="description" defaultValue={objective.description ?? ""} rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-4" />
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
  );
}

// -----------------------------------------------------------------------
// Outcome
// -----------------------------------------------------------------------

export function NewOutcomeForm({ objectiveId, projectId }: { objectiveId: string; projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
        + Add Outcome
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createOutcome(objectiveId, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-4"
    >
      <input name="code" placeholder="Code (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <input name="name" placeholder="Outcome" required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-3" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-4" />
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function OutcomeHeader({
  outcome,
  projectId,
  canEdit,
}: {
  outcome: Tables<"outcomes">;
  projectId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) {
    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outcome</p>
        <p className="text-sm font-medium text-slate-800">{outcome.name}</p>
      </>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outcome {outcome.code ? `(${outcome.code})` : ""}</p>
          <p className="text-sm font-medium text-slate-800">{outcome.name}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveOutcome(outcome.id, projectId, !outcome.archived_at);
                if (result.error) setError(result.error);
                else router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {outcome.archived_at ? "Restore" : "Archive"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateOutcome(outcome.id, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setEditing(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
    >
      <input name="code" defaultValue={outcome.code ?? ""} placeholder="Code" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <input name="name" defaultValue={outcome.name} required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-3" />
      <textarea name="description" defaultValue={outcome.description ?? ""} rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-4" />
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
  );
}

// -----------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------

export function NewOutputForm({ outcomeId, projectId }: { outcomeId: string; projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
        + Add Output
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createOutput(outcomeId, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-4"
    >
      <input name="code" placeholder="Code (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <input name="name" placeholder="Output" required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" />
      <input name="target" type="number" min={0} step="any" placeholder="Target (optional)" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-4" />
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function OutputHeader({
  output,
  projectId,
  canEdit,
}: {
  output: Tables<"outputs">;
  projectId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) {
    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Output</p>
        <p className="text-sm text-slate-700">{output.name}</p>
      </>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Output {output.code ? `(${output.code})` : ""} {output.target != null ? `· target ${output.target}` : ""}
          </p>
          <p className="text-sm text-slate-700">{output.name}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-teal-700 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveOutput(output.id, projectId, !output.archived_at);
                if (result.error) setError(result.error);
                else router.refresh();
              })
            }
            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            {output.archived_at ? "Restore" : "Archive"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateOutput(output.id, projectId, formData);
          if (result.error) setError(result.error);
          else {
            setEditing(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
    >
      <input name="code" defaultValue={output.code ?? ""} placeholder="Code" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <input name="name" defaultValue={output.name} required className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" />
      <input name="target" type="number" min={0} step="any" defaultValue={output.target ?? ""} placeholder="Target" className="rounded-md border border-slate-300 px-2 py-1 text-xs" />
      <textarea name="description" defaultValue={output.description ?? ""} rows={2} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-4" />
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
  );
}

// -----------------------------------------------------------------------
// Activity (creation only — editing lives in ActivityCard)
// -----------------------------------------------------------------------

const ACTIVITY_STATUSES = ["not_started", "ongoing", "completed", "delayed", "cancelled"];

export function NewActivityForm({
  projectId,
  outputId,
  staff,
  locations,
}: {
  projectId: string;
  outputId: string;
  staff: { id: string; full_name: string }[];
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-teal-700 hover:underline">
        + Add Activity
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createActivity(projectId, outputId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="mt-2 grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-3"
    >
      <input name="name" placeholder="Activity name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3" />
      <select name="responsible_staff_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>
      <select name="location_id" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">No location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <select name="priority" defaultValue="medium" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input name="start_date" type="date" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="end_date" type="date" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <select name="status" defaultValue="not_started" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {ACTIVITY_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
        ))}
      </select>
      <input name="target" type="number" min={0} step="any" placeholder="Target (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input name="budget" type="number" min={0} step="0.01" placeholder="Budget (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <textarea name="description" placeholder="Description (optional)" rows={2} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3" />

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isPending ? "Saving…" : "Save activity"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
