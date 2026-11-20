import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Library, LogOut } from "lucide-react";
import type { ReactNode } from "react";

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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Link to="/" className="flex min-w-0 items-center gap-2 md:hidden">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Library className="size-3.5" />
              </span>
              <span className="truncate font-display text-base leading-none">La mia libreria</span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <ExportCsvButton books={books} />
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Esci">
                <LogOut /> <span className="hidden sm:inline">Esci</span>
              </Button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 md:py-10">
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
