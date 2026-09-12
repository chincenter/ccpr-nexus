# CCPR Nexus

Programme and project management platform for the **Chin Center for Peace and
Reconciliation (CCPR)** — a Myanmar NGO working in conflict-affected and
cross-border areas between Burma/Myanmar and India.

CCPR Nexus follows one core principle: **enter data once, connect it, use it
everywhere.** A programme is created once; its projects, results framework,
activities, tasks, locations and (in later phases) budgets, indicators and
risks all connect back to it through real database relationships — not
free-text fields. The same connected data feeds the dashboard, project
workspaces, and every report.

## Technology stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase — PostgreSQL 17, Auth, Storage, Row Level Security, PostGIS
- **Hosting:** Vercel (frontend), Supabase (database/auth/storage)

## Project status: Phase 0 through Phase 4

This repository currently implements the **foundation**, **core operations**,
**project management**, **management systems**, and **programme modules**
phases:

- Authentication (Supabase Auth: sign-in, self-service registration,
  password reset/change) with a `staff` table carrying the real
  access-control role — separate from job title
- Full core hierarchy with real foreign keys: Programme → Project →
  Objective → Outcome → Output → Activity → Task
- Row Level Security on every table, scoped by role + project/programme
  assignment (see [Security notes](#security-notes) below)
- An audit log that records every insert/update/delete on the core tables,
  written only by a `SECURITY DEFINER` trigger — no role can write to it directly
- Dashboard (with live management alerts computed from real data — delayed
  activities, overdue tasks/governance actions, over-budget projects, high
  risks, off-track indicators), Programmes, Projects (with a project
  workspace showing the full results-framework-to-task chain plus its
  locations, risks, indicators, finance link, programme module link, and
  documents), Activities, a cross-project Workplan view, Locations, Risk
  Register, Documents/Evidence (Supabase Storage), Attendance, Team, My
  Work, Users & Access, Audit Log, M&E/MEAL indicators, Finance
  (budgets/expenditure/commitments with role-restricted access), Reports
  (CSV export), and a super-admin Data Management browser
- Four programme modules, each connected to projects/programmes through
  real foreign keys rather than free text:
  - **Humanitarian** — needs assessments, households, beneficiaries,
    assistance plans, distributions
  - **Landmine / Mine Action** — hazard tracking with role-based
    coordinate sensitivity (see [Security notes](#security-notes)), mine
    risk education/community awareness sessions, surveys, victim assistance
  - **Health** — facilities, services, outreach, referrals (explicitly not
    a medical-record system)
  - **Governance** — stakeholder → consultation → recommendation →
    decision → action, with overdue actions flagged automatically
- Connected demo data across 4 programmes and 8 projects (see
  [Demo data](#demo-data) below)

Phase 5 (GIS map layers, advanced dashboards, offline readiness, donor
reporting) is represented in the sidebar navigation as a disabled "Phase 5"
entry so the intended shape of the system stays visible, but is not yet built.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Where to find it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | Safe to expose to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API | The publishable/anon key — safe to expose; RLS is the real security boundary, not this key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API | **Server-only.** Never expose to the browser, never commit a real value. Not currently used by the app itself; reserved for future admin scripts/edge functions |

## Database setup / migrations

All schema changes live as plain SQL files in `supabase/migrations/`,
applied in filename order. They are the source of truth — do not make ad hoc
schema changes in the Supabase dashboard without also recording them here.

Migration order matters: extensions/enums → staff & auth helpers →
programmes/projects → results framework → locations → activities/tasks →
audit log → RLS policies → advisor fixes → demo data → the one real admin
login → demo login accounts → the `app` schema grant fix → risks →
documents → attendance → indicators → finance → the four Phase 4 modules
(humanitarian, mine action, health, governance) and their demo data.

### Demo data

Migrations `0011`–`0012` and `0014` seed **connected, fictional** demo data:
4 programmes, 8 projects, and a full objective → outcome → output → activity
→ task chain for each project, with deliberately varied statuses (completed,
ongoing, delayed, not started) so progress calculations have real variety.
Every demo record is flagged `is_demo = true` in the database and shown with
a **"DEMO DATA — NOT REAL CCPR DATA"** badge in the UI — this is a structural
column, not a naming convention, so demo rows can always be reliably
identified or bulk-cleared later.

**Demo logins** (`CcprNexusDemo2026!` for all of them) let you explore
different access levels:

| Email | Role |
|---|---|
| `demo.viewer@ccpr-nexus.test` | Viewer (most restricted) |
| `demo.po.emergency@ccpr-nexus.test` | Project Officer (Emergency Response project) |
| `demo.finance@ccpr-nexus.test` | Finance |
| `demo.assistant@ccpr-nexus.test` | Project Assistant / Field Staff |

**The real super_admin login** for `lalnunboris@gmail.com` was seeded with a
one-time setup password (`CcprNexus!Setup2026`) in migration `0013` — sign in
and change it via Supabase Auth's password reset flow as soon as convenient;
it is not demo data.

## Security notes

- **RLS is the real boundary**, not the frontend. Every table has Row Level
  Security enabled with explicit policies; there is no table where "no
  policy" silently means "open to everyone" — no policy means no access.
- Role and scope come from the `staff` table via `staff.user_id → auth.uid()`,
  never from matching email text at query time.
- A dedicated `app` schema holds `SECURITY DEFINER` helper functions
  (`current_staff_id()`, `has_project_access()`, etc.) used by every RLS
  policy, each with `search_path` locked to prevent hijacking.
- The audit log (`public.audit_log`) has no direct INSERT/UPDATE/DELETE
  grant for any role — only its own `SECURITY DEFINER` trigger can write to
  it, so it cannot be tampered with even by a super_admin's ordinary queries.
- **Mine hazard coordinate sensitivity** (Phase 4): Postgres RLS is
  row-level, not column-level, so a hazard's precise coordinates live in
  their own table (`mine_hazard_coordinates`) with a stricter policy than
  the hazard record itself. Anyone with project/programme access sees the
  hazard and a point generalized to a ~1km grid (`mine_hazards.coordinates_generalized`,
  computed by a trigger); only that project's own field team, its named
  project officer, the parent programme's lead, or a super_admin can read
  the precise point — executives and programme managers who only have
  access via `is_management()`/programme leadership get the generalized
  view, per the spec's "senior management sees generalized locations only."
  `locations.is_sensitive` remains a separate, coarser row-level hide for
  the shared Locations list.
- **Grant gotcha to remember if you add new `app.*()` helper functions:**
  `SECURITY DEFINER` does not imply the calling role can invoke the
  function — `authenticated` also needs `USAGE` on the `app` schema and
  `EXECUTE` on the function itself (see `0015_grant_app_schema.sql`, which
  also sets a default privilege so this doesn't need repeating by hand).
  This was caught and fixed by directly impersonating a non-admin role
  (`set local role authenticated; set local request.jwt.claims`) and
  confirming both an expected denial and an expected allow before trusting
  any policy.

## Development workflow

- Feature work happens on branches off `main`; this repo's history so far
  is Phase 0 + Phase 1 foundation work.
- Run `npm run lint` and `npx tsc --noEmit` before pushing — both must be
  clean.
- Schema changes: add a new numbered file under `supabase/migrations/`,
  apply it to the linked Supabase project, and re-run the security/
  performance advisors before committing.

## Deployment

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. Set the three environment variables above in Vercel's project settings.
4. Deploy. Vercel builds and serves the Next.js app; Supabase remains the
   database/auth/storage backend regardless of where the frontend is hosted.
