import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

type NavItem = (typeof NAV_ITEMS)[number];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.url}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] min-[380px]:text-[11px] font-medium transition-colors",
        active ? "font-semibold text-gold" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-[3px] border-[1.5px] border-transparent transition-colors",
          active && "border-gold/50 bg-primary/15",
        )}
      >
        <item.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className="max-w-full truncate px-0.5 leading-none">{item.title}</span>
    </Link>
  );
}

/** Fixed bottom navigation shown only below the md breakpoint (768px). */
export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [home, toRead, read, stats, ai] = NAV_ITEMS;

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-30 max-w-full border-t-[1.5px] border-line/70 bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-1">
        <NavLink item={home} active={pathname === home.url} />
        <NavLink item={toRead} active={pathname === toRead.url} />
        <NavLink item={read} active={pathname === read.url} />
        <NavLink item={stats} active={pathname === stats.url} />
        <NavLink item={ai} active={pathname === ai.url} />
      </div>
    </nav>
  );
}
