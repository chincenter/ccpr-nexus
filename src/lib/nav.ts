export type NavItem = {
  label: string;
  href?: string;
  phase?: number; // set when not yet built — shown but disabled
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    title: "Programmes",
    items: [
      { label: "Programmes", href: "/programmes" },
      { label: "Projects", href: "/projects" },
      { label: "Activities", href: "/activities" },
      { label: "Workplan", href: "/workplan" },
    ],
  },
  {
    title: "Programme Modules",
    items: [
      { label: "Humanitarian", href: "/humanitarian" },
      { label: "Landmine / Mine Action", href: "/mine-action" },
      { label: "Health", href: "/health" },
      { label: "Governance", href: "/governance" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "M&E / MEAL", href: "/me-meal" },
      { label: "Finance", href: "/finance" },
      { label: "GIS Map", phase: 5 },
      { label: "Risks & Security", href: "/risks" },
      { label: "Reports", href: "/reports" },
      { label: "Documents", href: "/documents" },
      { label: "Locations", href: "/locations" },
    ],
  },
  {
    title: "People & Admin",
    items: [
      { label: "Team", href: "/team" },
      { label: "Attendance", href: "/attendance" },
      { label: "My Work", href: "/my-work" },
      { label: "Users & Access", href: "/users" },
      { label: "Audit Log", href: "/audit-log" },
      { label: "Data Management", href: "/data" },
    ],
  },
];
