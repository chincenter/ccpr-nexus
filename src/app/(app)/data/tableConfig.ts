export type DataTableName =
  | "staff"
  | "programmes"
  | "projects"
  | "activities"
  | "tasks"
  | "risks"
  | "indicators"
  | "locations";

export const DATA_TABLES: Record<DataTableName, { label: string; searchColumn: string; archiveColumn: "archived_at" | "is_active" }> = {
  staff: { label: "Staff", searchColumn: "full_name", archiveColumn: "is_active" },
  programmes: { label: "Programmes", searchColumn: "name", archiveColumn: "archived_at" },
  projects: { label: "Projects", searchColumn: "name", archiveColumn: "archived_at" },
  activities: { label: "Activities", searchColumn: "name", archiveColumn: "archived_at" },
  tasks: { label: "Tasks", searchColumn: "name", archiveColumn: "archived_at" },
  risks: { label: "Risks", searchColumn: "title", archiveColumn: "archived_at" },
  indicators: { label: "Indicators", searchColumn: "name", archiveColumn: "archived_at" },
  locations: { label: "Locations", searchColumn: "name", archiveColumn: "archived_at" },
};

export const PAGE_SIZE = 20;
