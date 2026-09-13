import { createClient } from "@/lib/supabase/server";
import { GisMapLoader } from "./GisMapLoader";
import type { MapMarker } from "./GisMap";

export default async function GisPage() {
  const supabase = await createClient();

  const [
    { data: projectLocations },
    { data: households },
    { data: distributions },
    { data: hazards },
    { data: facilities },
    { data: stakeholders },
    { data: consultations },
  ] = await Promise.all([
    supabase
      .from("project_locations")
      .select("project:projects(id, name, status), location:locations(id, name, lat, lng)"),
    supabase
      .from("households")
      .select("id, household_code, project:projects(id, name), location:locations(lat, lng)")
      .is("archived_at", null),
    supabase
      .from("distributions")
      .select("id, assistance_type, distribution_date, project:projects(id, name), location:locations(lat, lng)"),
    supabase
      .from("mine_hazards")
      .select(
        "id, hazard_code, hazard_type, risk_level, status, generalized_lat, generalized_lng, project:projects(id, name), programme:programmes(id, name), mine_hazard_coordinates(precise_lat, precise_lng)",
      )
      .is("archived_at", null),
    supabase
      .from("health_facilities")
      .select("id, name, facility_type, project:projects(id, name), location:locations(lat, lng)")
      .is("archived_at", null),
    supabase
      .from("stakeholders")
      .select("id, name, stakeholder_type, project:projects(id, name), location:locations(lat, lng)")
      .is("archived_at", null),
    supabase
      .from("consultations")
      .select("id, topic, consultation_date, project:projects(id, name), location:locations(lat, lng)")
      .is("archived_at", null),
  ]);

  const markers: MapMarker[] = [];

  for (const pl of projectLocations ?? []) {
    const loc = pl.location as { id: string; name: string; lat: number | null; lng: number | null } | null;
    const project = pl.project as { id: string; name: string; status: string } | null;
    if (loc?.lat != null && loc.lng != null && project) {
      markers.push({
        layer: "projects",
        lat: loc.lat,
        lng: loc.lng,
        label: project.name,
        detail: `${loc.name} · ${project.status}`,
        href: `/projects/${project.id}`,
      });
    }
  }

  for (const h of households ?? []) {
    const loc = h.location as { lat: number | null; lng: number | null } | null;
    const project = h.project as { id: string; name: string } | null;
    if (loc?.lat != null && loc.lng != null) {
      markers.push({
        layer: "humanitarian",
        lat: loc.lat,
        lng: loc.lng,
        label: h.household_code,
        detail: project?.name ?? "",
        href: project ? `/humanitarian/${project.id}` : "/humanitarian",
      });
    }
  }

  for (const d of distributions ?? []) {
    const loc = d.location as { lat: number | null; lng: number | null } | null;
    const project = d.project as { id: string; name: string } | null;
    if (loc?.lat != null && loc.lng != null) {
      markers.push({
        layer: "humanitarian",
        lat: loc.lat,
        lng: loc.lng,
        label: `Distribution: ${d.assistance_type}`,
        detail: `${project?.name ?? ""} · ${d.distribution_date}`,
        href: project ? `/humanitarian/${project.id}` : "/humanitarian",
      });
    }
  }

  for (const hz of hazards ?? []) {
    const project = hz.project as { id: string; name: string } | null;
    const programme = hz.programme as { id: string; name: string } | null;
    const precise = hz.mine_hazard_coordinates as { precise_lat: number | null; precise_lng: number | null } | null;
    const lat = precise?.precise_lat ?? hz.generalized_lat;
    const lng = precise?.precise_lng ?? hz.generalized_lng;
    if (lat != null && lng != null) {
      markers.push({
        layer: "mine_action",
        lat,
        lng,
        label: hz.hazard_code,
        detail: `${hz.hazard_type} · ${hz.risk_level} risk · ${project?.name ?? programme?.name ?? ""}${
          precise ? "" : " (generalized)"
        }`,
        href: "/mine-action",
        severity: hz.risk_level === "high" ? "critical" : hz.risk_level === "medium" ? "warning" : undefined,
      });
    }
  }

  for (const f of facilities ?? []) {
    const loc = f.location as { lat: number | null; lng: number | null } | null;
    if (loc?.lat != null && loc.lng != null) {
      markers.push({
        layer: "health",
        lat: loc.lat,
        lng: loc.lng,
        label: f.name,
        detail: f.facility_type,
        href: "/health",
      });
    }
  }

  for (const s of stakeholders ?? []) {
    const loc = s.location as { lat: number | null; lng: number | null } | null;
    if (loc?.lat != null && loc.lng != null) {
      markers.push({
        layer: "governance",
        lat: loc.lat,
        lng: loc.lng,
        label: s.name,
        detail: s.stakeholder_type,
        href: "/governance",
      });
    }
  }

  for (const c of consultations ?? []) {
    const loc = c.location as { lat: number | null; lng: number | null } | null;
    if (loc?.lat != null && loc.lng != null) {
      markers.push({
        layer: "governance",
        lat: loc.lat,
        lng: loc.lng,
        label: c.topic,
        detail: c.consultation_date,
        href: "/governance",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">GIS Map</h1>
        <p className="text-sm text-slate-500">
          Programme areas across all modules. Mine Action hazard points are generalized to roughly 1km
          unless you have field access to that project — see the Landmine / Mine Action page for details.
        </p>
      </div>
      <GisMapLoader markers={markers} />
    </div>
  );
}
