import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ResultGroup = {
  title: string;
  rows: { label: string; detail: string; href: string }[];
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  if (!q) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Search</h1>
        <p className="text-sm text-slate-500">
          Enter a search term above to look across projects, activities, staff, locations,
          beneficiaries, indicators, and documents.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const like = `%${q}%`;

  const [
    { data: projectsByName },
    { data: projectsByCode },
    { data: activities },
    { data: staff },
    { data: locations },
    { data: beneficiaries },
    { data: indicators },
    { data: documents },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, code").ilike("name", like).limit(10),
    supabase.from("projects").select("id, name, code").ilike("code", like).limit(10),
    supabase.from("activities").select("id, name, project_id").ilike("name", like).limit(10),
    supabase.from("staff").select("id, full_name, job_title").ilike("full_name", like).limit(10),
    supabase.from("locations").select("id, name").ilike("name", like).limit(10),
    supabase.from("beneficiaries").select("id, beneficiary_code, household:households(project_id)").ilike("beneficiary_code", like).limit(10),
    supabase.from("indicators").select("id, name, project_id, programme_id").ilike("name", like).limit(10),
    supabase.from("documents").select("id, name, entity_type, entity_id").ilike("name", like).limit(10),
  ]);

  const projectsById = new Map([...(projectsByName ?? []), ...(projectsByCode ?? [])].map((p) => [p.id, p]));

  const groups: ResultGroup[] = [
    {
      title: "Projects",
      rows: [...projectsById.values()].map((p) => ({ label: p.name, detail: p.code, href: `/projects/${p.id}` })),
    },
    {
      title: "Activities",
      rows: (activities ?? []).map((a) => ({ label: a.name, detail: "Activity", href: `/projects/${a.project_id}` })),
    },
    {
      title: "Staff",
      rows: (staff ?? []).map((s) => ({ label: s.full_name, detail: s.job_title ?? "Staff", href: "/team" })),
    },
    {
      title: "Locations",
      rows: (locations ?? []).map((l) => ({ label: l.name, detail: "Location", href: "/locations" })),
    },
    {
      title: "Beneficiaries",
      rows: (beneficiaries ?? []).map((b) => {
        const projectId = (b.household as { project_id: string } | null)?.project_id;
        return {
          label: b.beneficiary_code,
          detail: "Beneficiary",
          href: projectId ? `/humanitarian/${projectId}` : "/humanitarian",
        };
      }),
    },
    {
      title: "Indicators",
      rows: (indicators ?? []).map((i) => ({
        label: i.name,
        detail: "Indicator",
        href: i.project_id ? `/projects/${i.project_id}` : "/me-meal",
      })),
    },
    {
      title: "Documents",
      rows: (documents ?? []).map((d) => ({ label: d.name, detail: d.entity_type, href: "/documents" })),
    },
  ];

  const totalResults = groups.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Search results for &quot;{q}&quot;</h1>
        <p className="text-sm text-slate-500">
          {totalResults} result{totalResults === 1 ? "" : "s"} across projects, activities, staff,
          locations, beneficiaries, indicators, and documents.
        </p>
      </div>

      {groups
        .filter((g) => g.rows.length > 0)
        .map((group) => (
          <div key={group.title}>
            <h2 className="text-base font-semibold text-slate-900">{group.title}</h2>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {group.rows.map((row, i) => (
                <li key={i}>
                  <Link href={row.href} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-800">{row.label}</span>
                    <span className="text-xs text-slate-500">{row.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {totalResults === 0 && <p className="text-sm text-slate-500">No matches found.</p>}
    </div>
  );
}
