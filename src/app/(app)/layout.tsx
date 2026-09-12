import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentStaff } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  executive: "Executive / Senior Management",
  programme_manager: "Programme Manager",
  project_officer: "Project Officer",
  project_assistant: "Project Assistant / Field Staff",
  me_meal: "M&E / MEAL",
  finance: "Finance",
  viewer: "Viewer",
};

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const staff = await getCurrentStaff();

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-900">No staff profile linked</p>
          <p className="mt-1 text-sm text-amber-800">
            Your account signed in, but no staff record in CCPR Nexus matches your email yet.
            Ask a Super Administrator to add you under Team.
          </p>
          <form action="/auth/sign-out" method="post" className="mt-4">
            <button type="submit" className="text-sm font-medium text-amber-900 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar staffName={staff.full_name} roleLabel={ROLE_LABELS[staff.system_role] ?? staff.system_role} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
