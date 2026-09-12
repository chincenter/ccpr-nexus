import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const { data: documents } = await supabase
    .from("documents")
    .select("*, uploader:staff!documents_created_by_fkey(full_name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const projectIds = (documents ?? []).filter((d) => d.entity_type === "project").map((d) => d.entity_id);
  const { data: projects } = projectIds.length
    ? await supabase.from("projects").select("id, name").in("id", projectIds)
    : { data: [] };
  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  const withSource = (documents ?? []).map((doc) => ({
    ...doc,
    sourceLabel:
      doc.entity_type === "project" && projectNameById.has(doc.entity_id)
        ? projectNameById.get(doc.entity_id)!
        : doc.entity_type,
    sourceHref: doc.entity_type === "project" ? `/projects/${doc.entity_id}` : undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">
          Every document is attached to a project, activity, or other record — upload from that
          record&apos;s page. This view shows everything you have access to.
        </p>
      </div>

      <DocumentList documents={withSource} canEdit={false} />
    </div>
  );
}
