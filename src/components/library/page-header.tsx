import type { ReactNode } from "react";

import { FourPointStar, OrnamentRule } from "@/components/brand/ornaments";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <FourPointStar className="size-2.5 text-primary" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 text-3xl sm:text-4xl">{title}</h1>
        </div>
        {actions}
      </div>
      <OrnamentRule />
    </div>
  );
}
