import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff, OPERATIONAL_ROLES } from "@/lib/auth";
import { HouseholdCard } from "./HouseholdCard";
import { DistributionCard } from "./DistributionCard";
import { NewHouseholdForm } from "./NewHouseholdForm";
import { NewDistributionForm } from "./NewDistributionForm";

export default async function ProjectHumanitarianPage({ params }: PageProps<"/humanitarian/[projectId]">) {
  const { projectId } = await params;
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const canEdit = !!staff && (OPERATIONAL_ROLES as readonly string[]).includes(staff.system_role);

  const { data: project } = await supabase.from("projects").select("id, name, code").eq("id", projectId).maybeSingle();
  if (!project) notFound();

  const [{ data: households }, { data: distributions }, { data: locations }, { data: plans }] = await Promise.all([
    supabase
      .from("households")
      .select("*, beneficiaries(*), location:locations(name)")
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("household_code"),
    supabase
      .from("distributions")
      .select("*, distribution_items(*, household:households(household_code), beneficiary:beneficiaries(beneficiary_code)), assistance_plan:assistance_plans(name), location:locations(name)")
      .eq("project_id", projectId)
      .order("distribution_date", { ascending: false }),
    supabase.from("locations").select("id, name").is("archived_at", null).order("name"),
    supabase.from("assistance_plans").select("id, name").eq("project_id", projectId).is("archived_at", null).order("name"),
  ]);

  const householdList = households ?? [];
  const householdOptions = householdList.map((h) => ({ id: h.id, household_code: h.household_code }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-slate-500">{project.code}</p>
        <h1 className="text-xl font-semibold text-slate-900">{project.name} — Humanitarian</h1>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Households &amp; beneficiaries</h2>
        </div>
        <div className="mt-3 space-y-3">
          {canEdit && <NewHouseholdForm projectId={project.id} locations={locations ?? []} />}
          {householdList.map((h) => (
            <HouseholdCard key={h.id} projectId={project.id} household={h} canEdit={canEdit} />
          ))}
          {householdList.length === 0 && <p className="text-sm text-slate-500">No households registered yet.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Distributions</h2>
        </div>
        <div className="mt-3 space-y-3">
          {canEdit && <NewDistributionForm projectId={project.id} locations={locations ?? []} plans={plans ?? []} />}
          {(distributions ?? []).map((d) => (
            <DistributionCard key={d.id} projectId={project.id} distribution={d} households={householdOptions} canEdit={canEdit} />
          ))}
          {(distributions ?? []).length === 0 && <p className="text-sm text-slate-500">No distributions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
