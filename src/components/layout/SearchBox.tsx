import { Search } from "lucide-react";

export function SearchBox() {
  return (
    <form action="/search" method="get" className="px-4 py-3">
      <label className="relative block">
        <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          placeholder="Search…"
          className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-2 text-sm placeholder:text-slate-400"
        />
      </label>
    </form>
  );
}
