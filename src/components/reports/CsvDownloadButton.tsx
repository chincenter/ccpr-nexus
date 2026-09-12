"use client";

import { toCsv, downloadCsv } from "@/lib/csv";

export function CsvDownloadButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, toCsv(headers, rows))}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Download CSV
    </button>
  );
}
