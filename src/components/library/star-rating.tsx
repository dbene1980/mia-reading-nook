import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "size-3.5", md: "size-5", lg: "size-7" };

export function StarRating({ value, onChange, size = "sm", className }: StarRatingProps) {
  const interactive = Boolean(onChange);
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={value ? `${value} stelle su 5` : "Nessuna valutazione"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const icon = (
          <Star
            className={cn(
              SIZES[size],
              "transition-transform",
              filled ? "fill-star text-star" : "text-muted-foreground/40",
            )}
          />
        );
        if (!interactive) return <span key={n}>{icon}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} stelle`}
            onClick={() => onChange?.(n)}
            className="rounded-full p-0.5 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
