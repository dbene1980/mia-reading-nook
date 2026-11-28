import { cn } from "@/lib/utils";

/** Rubber-stamp "LETTO" mark laid over the cover of a finished book. */
export function ReadStamp({ className }: { className?: string }) {
  return (
    <span
      aria-label="Letto"
      className={cn(
        "pointer-events-none absolute bottom-[10%] left-1/2 -translate-x-1/2 -rotate-12 select-none rounded-full border border-primary/80 bg-background/85 px-[0.45em] py-[0.1em] font-display text-[9px] font-bold tracking-[0.2em] text-primary shadow-sm @[5rem]:text-[11px] @[8rem]:text-sm",
        className,
      )}
    >
      LETTO
    </span>
  );
}
