import { useEffect, useState } from "react";

import { FourPointStar } from "@/components/brand/ornaments";
import { cn } from "@/lib/utils";

import { ReadStamp } from "./read-stamp";

interface BookCoverProps {
  url: string | null;
  titolo: string;
  autore?: string | null;
  className?: string;
  /** Show the "LETTO" stamp (finished books). */
  read?: boolean;
}

const PALETTE = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] as const;

/** Stable color per title, so a book always gets the same placeholder. */
function paletteFor(titolo: string) {
  let h = 0;
  for (const ch of titolo) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length] as string;
}

const CORNERS = ["left-[3%] top-[2%]", "right-[3%] top-[2%]", "left-[3%] bottom-[2%]", "right-[3%] bottom-[2%]"];

export function BookCover({ url, titolo, autore, className, read }: BookCoverProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const src = url?.trim();
  const showImage = Boolean(src) && !broken;
  const tone = `var(${paletteFor(titolo)})`;

  return (
    <div
      className={cn(
        "@container relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-sm",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={`Copertina di ${titolo}`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Copertina non disponibile: ${titolo}`}
          className="relative flex h-full w-full items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(165deg, color-mix(in oklab, ${tone} 18%, var(--card)), var(--background))`,
          }}
        >
          {/* fine-line tattoo frame */}
          <span aria-hidden className="absolute inset-[7%] border border-gold/70" />
          <span aria-hidden className="absolute inset-[11%] border border-dotted border-gold/45" />
          {CORNERS.map((pos) => (
            <FourPointStar key={pos} className={cn("absolute size-[14cqw] text-gold", pos)} />
          ))}
          <div className="relative grid w-[72%] justify-items-center gap-[0.4em] text-center">
            <FourPointStar className="size-[12cqw] text-primary" />
            <span className="line-clamp-4 font-display text-[8px] font-semibold leading-tight text-foreground @[4.5rem]:text-[10px] @[7rem]:text-sm @[10rem]:text-lg">
              {titolo}
            </span>
            <span aria-hidden className="h-px w-1/2 bg-gold/60" />
            {autore && (
              <span className="line-clamp-2 text-[6px] uppercase tracking-wider text-foreground/70 @[4.5rem]:text-[8px] @[7rem]:text-[10px] @[10rem]:text-xs">
                {autore}
              </span>
            )}
          </div>
        </div>
      )}
      {read && <ReadStamp />}
    </div>
  );
}
