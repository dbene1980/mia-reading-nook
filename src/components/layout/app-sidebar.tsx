import { Link, useRouterState } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FourPointStar } from "@/components/brand/ornaments";

import { NAV_ITEMS as items } from "./nav-items";

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-5">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpenMobile(false)}>
          <BrandLogo className={collapsed ? "size-8" : "size-11"} />
          {!collapsed && (
            <span className="grid gap-1 leading-none">
              <span className="font-display text-base font-semibold tracking-wide text-sidebar-accent-foreground">
                La Libreria
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">di Daniele</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10 rounded-xl border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:font-semibold data-[active=true]:text-gold"
                  >
                    <Link to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-4">
        {!collapsed && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-sidebar-foreground/60">
            <FourPointStar className="mt-0.5 size-2.5 shrink-0 text-primary" />
            Ogni libro letto è un tatuaggio sull'anima.
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
