import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { BookFormDialog } from "@/components/library/book-form-dialog";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useBooks } from "@/lib/books-data";
import { useBookActions } from "@/lib/use-book-actions";

import { AppSidebar } from "./app-sidebar";
import { ExportCsvButton } from "./export-csv-button";
import { MobileBottomNav } from "./mobile-bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const { books } = useBooks();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const quickAdd = useBookActions();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full max-w-full overflow-x-clip">
        <AppSidebar />
        <SidebarInset className="min-w-0 max-w-full bg-transparent">
          <header className="sticky top-0 z-20 flex h-14 w-full max-w-full items-center justify-between gap-2 border-b-[1.5px] border-line/60 bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Link to="/" className="flex min-w-0 items-center gap-2 md:hidden">
              <BrandLogo className="size-8" />
              <span className="truncate font-display text-sm font-semibold leading-none tracking-wide">
                La Libreria di Daniele
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <ExportCsvButton books={books} />
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Esci">
                <LogOut /> <span className="hidden sm:inline">Esci</span>
              </Button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 md:py-10">
            {children}
          </div>
        </SidebarInset>
      </div>

      <MobileBottomNav onAdd={quickAdd.openNew} />
      <BookFormDialog
        open={quickAdd.formOpen}
        onOpenChange={quickAdd.setFormOpen}
        book={null}
        onSave={quickAdd.save}
      />
    </SidebarProvider>
  );
}
