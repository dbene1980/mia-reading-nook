import { cn } from "@/lib/utils";

/** Round flash-tattoo seal: "EX LIBRIS · DANIELE" around a vermilion star. */
export function ExLibrisStamp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden
      className={cn("size-24 shrink-0 -rotate-12 text-gold drop-shadow-[3px_3px_0_var(--background)]", className)}
    >
      <defs>
        <path id="exlibris-ring" d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="0.1 4" strokeLinecap="round" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text
        fill="currentColor"
        fontFamily="Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="11.5"
        fontWeight="700"
        letterSpacing="2.4"
      >
        <textPath href="#exlibris-ring" startOffset="0">
          EX LIBRIS ✦ DANIELE ✦
        </textPath>
      </text>
      <path
        d="M60 36 Q62.6 57.4 84 60 Q62.6 62.6 60 84 Q57.4 62.6 36 60 Q57.4 57.4 60 36 Z"
        fill="var(--primary)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="60" r="2.5" fill="currentColor" />
    </svg>
  );
}
