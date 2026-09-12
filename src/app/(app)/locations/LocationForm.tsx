"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLocation } from "./actions";

export function LocationForm({ locationTypes }: { locationTypes: readonly string[] }) {
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
        + Add location
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createLocation(formData);
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
        <label className="block text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Type</label>
        <select name="location_type" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {locationTypes.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">State/Region</label>
        <input name="state_region" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">District</label>
        <input name="district" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Township</label>
        <input name="township" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Village (optional)</label>
        <input name="village" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Latitude (optional)</label>
        <input name="latitude" type="number" step="any" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Longitude (optional)</label>
        <input name="longitude" type="number" step="any" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save location"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
