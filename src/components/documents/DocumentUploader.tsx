"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DocumentUploader({
  entityType,
  entityId,
}: {
  entityType: "project" | "programme" | "activity" | "task" | "risk" | "indicator";
  entityId: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();

    const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      entity_type: entityType,
      entity_id: entityId,
      name: file.name,
      category: category || null,
      storage_path: path,
    });

    setUploading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (fileInput.current) fileInput.current.value = "";
    setCategory("");
    router.refresh();
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-slate-300 p-3">
      <div>
        <label className="block text-xs font-medium text-slate-600">File</label>
        <input ref={fileInput} type="file" required className="mt-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Category (optional)</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. report, photo"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={uploading}
        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
