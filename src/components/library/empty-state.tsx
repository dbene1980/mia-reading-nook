import type { ReactNode } from "react";
import { Library } from "lucide-react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <Library className="size-8 text-primary/60" />
      <h3 className="text-lg">{title}</h3>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
