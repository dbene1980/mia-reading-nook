import { cn } from "@/lib/utils";

/** Concave 4-point star, the recurring tattoo "sparkle". Inherits currentColor. */
export function FourPointStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-3", className)} fill="currentColor">
      <path d="M12 0 Q13.2 10.8 24 12 Q13.2 13.2 12 24 Q10.8 13.2 0 12 Q10.8 10.8 12 0 Z" />
    </svg>
  );
}

/** Fine-line divider with a centered star, like the rule on a flash sheet. */
export function OrnamentRule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3 text-gold", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <span className="size-1 rounded-full bg-gold/70" />
      <FourPointStar className="size-3.5 text-primary" />
      <span className="size-1 rounded-full bg-gold/70" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}
