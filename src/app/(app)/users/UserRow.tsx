"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffRole, toggleStaffActive } from "./actions";
import type { Enums, Tables } from "@/lib/types/database";

const ROLES: Enums<"system_role">[] = [
  "super_admin",
  "executive",
  "programme_manager",
  "project_officer",
  "project_assistant",
  "me_meal",
  "finance",
  "viewer",
];

export function UserRow({ member, isSelf }: { member: Tables<"staff">; isSelf: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2 font-medium text-slate-900">
        {member.full_name}
        {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
      </td>
      <td className="px-4 py-2 text-slate-500">{member.email}</td>
      <td className="px-4 py-2">
        <select
          defaultValue={member.system_role}
          disabled={isPending || isSelf}
          onChange={(e) => {
            const role = e.target.value as Enums<"system_role">;
            startTransition(async () => {
              await updateStaffRole(member.id, role);
              router.refresh();
            });
          }}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2 text-slate-500">{member.user_id ? "Linked" : "Not signed up yet"}</td>
      <td className="px-4 py-2 text-right">
        <button
          type="button"
          disabled={isPending || isSelf}
          onClick={() =>
            startTransition(async () => {
              await toggleStaffActive(member.id, !member.is_active);
              router.refresh();
            })
          }
          className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          {member.is_active ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
