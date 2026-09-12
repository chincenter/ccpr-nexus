"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn, checkOut, setTodayStatus } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const STATUSES: Enums<"attendance_status">[] = ["present", "leave", "absent", "field_duty", "remote"];

export function TodayPanel({ today }: { today: Tables<"attendance"> | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workLocation, setWorkLocation] = useState(today?.work_location ?? "");
  const [status, setStatus] = useState<Enums<"attendance_status">>(today?.status ?? "present");
  const [remarks, setRemarks] = useState(today?.remarks ?? "");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">Today</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Enums<"attendance_status">)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Work location</label>
          <input
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            placeholder="e.g. Head Office, Hakha field office"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Remarks (optional)</label>
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await setTodayStatus(status, workLocation, remarks);
              router.refresh();
            })
          }
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Save status
        </button>
        <button
          type="button"
          disabled={isPending || !!today?.check_in}
          onClick={() =>
            startTransition(async () => {
              await checkIn(workLocation);
              router.refresh();
            })
          }
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {today?.check_in ? `Checked in ${new Date(today.check_in).toLocaleTimeString()}` : "Check in"}
        </button>
        <button
          type="button"
          disabled={isPending || !today?.check_in || !!today?.check_out}
          onClick={() =>
            startTransition(async () => {
              await checkOut();
              router.refresh();
            })
          }
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {today?.check_out ? `Checked out ${new Date(today.check_out).toLocaleTimeString()}` : "Check out"}
        </button>
      </div>
    </div>
  );
}
