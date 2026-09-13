"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { NAV_SECTIONS } from "@/lib/nav";
import { Menu, X } from "lucide-react";
import { SearchBox } from "./SearchBox";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {section.title}
          </p>
          <div className="mt-1 space-y-0.5">
            {section.items.map((item) => {
              if (!item.href) {
                return (
                  <span
                    key={item.label}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-slate-300"
                    title={`Coming in Phase ${item.phase}`}
                  >
                    {item.label}
                    <span className="text-[10px] text-slate-300">Phase {item.phase}</span>
                  </span>
                );
              }
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    "block rounded-md px-3 py-1.5 text-sm font-medium",
                    active
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ staffName, roleLabel }: { staffName: string; roleLabel: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-base font-semibold text-slate-900">CCPR Nexus</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-base font-semibold text-slate-900">CCPR Nexus</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <SearchBox />
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter staffName={staffName} roleLabel={roleLabel} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <span className="text-lg font-semibold text-slate-900">CCPR Nexus</span>
        </div>
        <div className="border-b border-slate-200">
          <SearchBox />
        </div>
        <NavLinks />
        <SidebarFooter staffName={staffName} roleLabel={roleLabel} />
      </aside>
    </>
  );
}

function SidebarFooter({ staffName, roleLabel }: { staffName: string; roleLabel: string }) {
  return (
    <div className="border-t border-slate-200 px-4 py-3">
      <p className="truncate text-sm font-medium text-slate-800">{staffName}</p>
      <p className="text-xs text-slate-500">{roleLabel}</p>
      <div className="mt-2 flex items-center gap-3">
        <Link href="/account" className="text-xs font-medium text-slate-500 hover:text-slate-800">
          Account
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
