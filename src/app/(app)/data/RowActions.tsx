"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRowArchive } from "./actions";
import type { DataTableName } from "./tableConfig";

export function RowActions({ table, id, isArchived }: { table: DataTableName; id: string; isArchived: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleRowArchive(table, id, isArchived);
          router.refresh();
        })
      }
      className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
    >
      {isArchived ? "Restore" : "Archive"}
    </button>
  );
}
