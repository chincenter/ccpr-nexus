"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectLocation, removeProjectLocation } from "@/app/(app)/projects/[id]/actions";

export function NewProjectLocationForm({
  projectId,
  locations,
}: {
  projectId: string;
  locations: { id: string; name: string }[];
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
        + Link Location
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await addProjectLocation(projectId, formData);
          if (result.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <select name="location_id" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Select location…</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Link"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
      >
        Cancel
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function ProjectLocationPill({
  projectId,
  locationId,
  name,
  canEdit,
}: {
  projectId: string;
  locationId: string;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
      {name}
      {canEdit && (
        <button
          type="button"
          disabled={isPending}
          title={error ?? "Unlink location"}
          onClick={() =>
            startTransition(async () => {
              const result = await removeProjectLocation(projectId, locationId);
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
          className="text-slate-400 hover:text-red-700 disabled:opacity-60"
        >
          ×
        </button>
      )}
    </span>
  );
}
