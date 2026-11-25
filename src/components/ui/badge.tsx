import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[3px] border-[1.5px] px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Stato: rubber-stamp look — sharp colored outline, uppercase, spaced letters.
        stoleggendo:
          "border-gold bg-primary text-primary-foreground uppercase shadow-[2px_2px_0_0_color-mix(in_oklab,var(--gold)_45%,transparent)]",
        scaricato: "border-status-scaricato bg-status-scaricato/8 text-status-scaricato uppercase",
        comprato: "border-status-comprato bg-status-comprato/8 text-status-comprato uppercase",
        dascaricare: "border-status-dascaricare bg-status-dascaricare/8 text-status-dascaricare uppercase",
        dacomprare: "border-status-dacomprare bg-status-dacomprare/8 text-status-dacomprare uppercase",
        nontrovato: "border-status-nontrovato bg-status-nontrovato/8 text-status-nontrovato uppercase",
        tipo: "border-line bg-transparent text-foreground/80 font-medium tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
