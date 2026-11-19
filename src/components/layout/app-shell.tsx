import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useBooks } from "@/lib/books-data";

import { AppSidebar } from "./app-sidebar";
import { ExportCsvButton } from "./export-csv-button";

export function AppShell({ children }: { children: ReactNode }) {
  const { books } = useBooks();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
            <SidebarTrigger />
            <div className="flex items-center gap-1">
              <ExportCsvButton books={books} />
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Esci">
                <LogOut /> <span className="hidden sm:inline">Esci</span>
              </Button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
