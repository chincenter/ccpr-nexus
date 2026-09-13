"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIndicator, updateIndicator } from "./actions";
import type { Tables } from "@/lib/types/database";

type ResultOption = { id: string; label: string; project_id: string };

export function IndicatorForm({
  indicator,
  projects,
  programmes,
  staff,
  objectives,
  outcomes,
  outputs,
  fixedProjectId,
  onDone,
}: {
  indicator?: Tables<"indicators">;
  projects: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
  objectives: ResultOption[];
  outcomes: ResultOption[];
  outputs: ResultOption[];
  fixedProjectId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!!indicator && !!onDone);
  const [scope, setScope] = useState<"project" | "programme">(
    indicator?.programme_id && !indicator?.project_id ? "programme" : "project",
  );
  const [projectId, setProjectId] = useState(fixedProjectId ?? indicator?.project_id ?? "");
  const [resultLevel, setResultLevel] = useState<"" | "objective" | "outcome" | "output">(
    (indicator?.result_type as "objective" | "outcome" | "output" | null) ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const resultOptions = useMemo(() => {
    const source = resultLevel === "objective" ? objectives : resultLevel === "outcome" ? outcomes : outputs;
    return source.filter((o) => o.project_id === projectId);
  }, [resultLevel, projectId, objectives, outcomes, outputs]);

  function close() {
    setOpen(false);
    onDone?.();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
      >
        + Add indicator
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = indicator ? await updateIndicator(indicator.id, formData) : await createIndicator(formData);
          if (result.error) setError(result.error);
          else {
            close();
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="lg:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Indicator name</label>
        <input
          name="name"
          required
          defaultValue={indicator?.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Code (optional)</label>
        <input
          name="code"
          defaultValue={indicator?.code ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {!fixedProjectId && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "project" | "programme")}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="project">Project</option>
            <option value="programme">Programme</option>
          </select>
        </div>
      )}

      {!fixedProjectId && scope === "project" && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Project</label>
          <select
            name="project_id"
            required
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setResultLevel("");
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {fixedProjectId && <input type="hidden" name="project_id" value={fixedProjectId} />}

      {!fixedProjectId && scope === "programme" && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Programme</label>
          <select
            name="programme_id"
            required
            defaultValue={indicator?.programme_id ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Select programme…</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(fixedProjectId || scope === "project") && projectId && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600">Result level (optional)</label>
            <select
              value={resultLevel}
              onChange={(e) => setResultLevel(e.target.value as typeof resultLevel)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Not linked to a specific result</option>
              <option value="objective">Objective</option>
              <option value="outcome">Outcome</option>
              <option value="output">Output</option>
            </select>
          </div>
          {resultLevel && (
            <div>
              <label className="block text-xs font-medium text-slate-600 capitalize">{resultLevel}</label>
              <select
                name="result_id"
                defaultValue={indicator?.result_id ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="">Select {resultLevel}…</option>
                {resultOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      {resultLevel && <input type="hidden" name="result_type" value={resultLevel} />}

      <div>
        <label className="block text-xs font-medium text-slate-600">Unit</label>
        <input
          name="unit"
          defaultValue={indicator?.unit ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Baseline</label>
        <input
          name="baseline"
          type="number"
          min={0}
          step="any"
          defaultValue={indicator?.baseline ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Target</label>
        <input
          name="target"
          type="number"
          min={0}
          step="any"
          defaultValue={indicator?.target ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      {!indicator && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Actual (so far, optional)</label>
          <input name="actual" type="number" min={0} step="any" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600">Reporting period</label>
        <input
          name="reporting_period"
          placeholder="e.g. FY2026 or Q1 2026"
          defaultValue={indicator?.reporting_period ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Data source</label>
        <input
          name="data_source"
          defaultValue={indicator?.data_source ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Responsible</label>
        <select
          name="responsible_staff_id"
          defaultValue={indicator?.responsible_staff_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className="block text-xs font-medium text-slate-600">Definition (optional)</label>
        <textarea
          name="definition"
          rows={2}
          defaultValue={indicator?.definition ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className="block text-xs font-medium text-slate-600">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={indicator?.notes ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save indicator"}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
