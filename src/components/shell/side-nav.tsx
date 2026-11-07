"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Compass,
  MapPin,
  Users,
  Images,
  Copy,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/people", label: "People", icon: Users },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/albums", label: "Albums", icon: Images },
  { href: "/duplicates", label: "Duplicates", icon: Copy },
] as const;

type SideNavProps = {
  targetEmail: string | null;
  connectionOk: boolean;
};

export function SideNav({ targetEmail, connectionOk }: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          immich-curator
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          const prefetchUrlData =
            href === "/explore" || href === "/people";
          return (
            <Link
              key={href}
              href={href}
              prefetch={prefetchUrlData ? true : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>
      <footer className="border-t border-sidebar-border p-3 text-xs">
        <p
          className={cn(
            "mb-1 truncate",
            connectionOk ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {connectionOk ? "Connected" : "Immich unreachable"}
        </p>
        {targetEmail ? (
          <p className="truncate text-muted-foreground" title={targetEmail}>
            Target: {targetEmail}
          </p>
        ) : null}
        <Link
          href="/admin"
          className="mt-2 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Settings className="size-3.5" />
          Admin
        </Link>
      </footer>
    </aside>
  );
}
