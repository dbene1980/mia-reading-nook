import type { ReactNode } from "react";
import { DatabaseZap } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DATABASE_CONNECTED, useBooks } from "@/lib/books-data";

import { AppSidebar } from "./app-sidebar";
import { ExportCsvButton } from "./export-csv-button";

export function AppShell({ children }: { children: ReactNode }) {
  const { books } = useBooks();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <ExportCsvButton books={books} />
          </header>
          {!DATABASE_CONNECTED && (
            <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground/90 sm:mx-8">
              <DatabaseZap className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Anteprima: il tuo database non è ancora collegato, quindi i libri non vengono
                salvati.
              </p>
            </div>
          )}
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
