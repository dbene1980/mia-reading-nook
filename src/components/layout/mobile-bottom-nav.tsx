import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

type NavItem = (typeof NAV_ITEMS)[number];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.url}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
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
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          active && "bg-primary/15",
        )}
      >
        <item.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className="leading-none">{item.title}</span>
    </Link>
  );
}

/** Fixed bottom navigation shown only below the md breakpoint (768px). */
export function MobileBottomNav({ onAdd }: { onAdd: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [home, toRead, read] = NAV_ITEMS;

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        <NavLink item={home} active={pathname === home.url} />
        <NavLink item={toRead} active={pathname === toRead.url} />
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Aggiungi libro"
            className="-mt-6 flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </button>
        </div>
        <NavLink item={read} active={pathname === read.url} />
      </div>
    </nav>
  );
}
