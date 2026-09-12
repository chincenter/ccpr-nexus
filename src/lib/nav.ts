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
    ],
  },
  {
    title: "Programme Modules",
    items: [
      { label: "Humanitarian", phase: 4 },
      { label: "Landmine / Mine Action", phase: 4 },
      { label: "Health", phase: 4 },
      { label: "Governance", phase: 4 },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "M&E / MEAL", phase: 3 },
      { label: "Finance", phase: 3 },
      { label: "GIS Map", phase: 5 },
      { label: "Risks & Security", phase: 2 },
      { label: "Reports", phase: 3 },
      { label: "Documents", phase: 2 },
    ],
  },
  {
    title: "People & Admin",
    items: [
      { label: "Team", href: "/team" },
      { label: "Attendance", phase: 2 },
      { label: "My Work", href: "/my-work" },
      { label: "Users & Access", phase: 2 },
      { label: "Audit Log", href: "/audit-log" },
      { label: "Data Management", phase: 3 },
    ],
  },
];
