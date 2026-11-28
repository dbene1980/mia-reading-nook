import type { ReactNode } from "react";

import { FourPointStar } from "@/components/brand/ornaments";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
      <FourPointStar className="size-7 text-gold" />
      <h3 className="text-lg font-medium">{title}</h3>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
