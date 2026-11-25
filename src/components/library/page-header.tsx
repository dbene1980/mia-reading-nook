import type { ReactNode } from "react";

import { FourPointStar, OrnamentRule } from "@/components/brand/ornaments";

export function PageHeader({
  eyebrow,
  title,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 min-w-0 max-w-full gap-4">
      <div className="flex min-w-0 flex-col items-stretch gap-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-end min-[480px]:justify-between min-[480px]:gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <FourPointStar className="size-2.5 shrink-0 text-primary" />
              <span className="break-words">{eyebrow}</span>
            </p>
          )}
          <h1 className="mt-1.5 flex items-center gap-2 break-words text-2xl leading-tight min-[480px]:text-3xl sm:text-4xl">
            {icon && <span className="shrink-0">{icon}</span>}
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex min-w-0 max-w-full flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center">
            {actions}
          </div>
        )}
      </div>
      <OrnamentRule />
    </div>
  );
}
