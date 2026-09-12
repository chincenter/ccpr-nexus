"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database";

type Document = Tables<"documents"> & {
  uploader?: { full_name: string } | null;
  sourceLabel?: string;
  sourceHref?: string;
};

export function DocumentList({ documents, canEdit }: { documents: Document[]; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDownload(doc: Document) {
    setBusyId(doc.id);
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    setBusyId(null);
    if (error || !data) return;
    window.open(data.signedUrl, "_blank");
  }

  async function handleArchive(doc: Document) {
    const supabase = createClient();
    startTransition(async () => {
      await supabase
        .from("documents")
        .update({ archived_at: doc.archived_at ? null : new Date().toISOString() })
        .eq("id", doc.id);
      router.refresh();
    });
  }

  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">No documents uploaded yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
          <div>
            <button type="button" onClick={() => handleDownload(doc)} className="font-medium text-teal-800 hover:underline">
              {doc.name}
            </button>
            <p className="text-xs text-slate-500">
              {doc.category ?? "Uncategorized"} · v{doc.version}
              {doc.uploader?.full_name ? ` · ${doc.uploader.full_name}` : ""}
              {doc.sourceLabel && (
                <>
                  {" · "}
                  {doc.sourceHref ? (
                    <Link href={doc.sourceHref} className="capitalize text-teal-700 hover:underline">
                      {doc.sourceLabel}
                    </Link>
                  ) : (
                    <span className="capitalize">{doc.sourceLabel}</span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {busyId === doc.id && <span className="text-xs text-slate-400">Opening…</span>}
            {canEdit && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleArchive(doc)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
              >
                {doc.archived_at ? "Restore" : "Archive"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
