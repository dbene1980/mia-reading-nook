import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface BookCoverProps {
  url: string | null;
  titolo: string;
  autore?: string | null;
  className?: string;
}

const PALETTE = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] as const;

/** Stable color per title, so a book always gets the same placeholder. */
function paletteFor(titolo: string) {
  let h = 0;
  for (const ch of titolo) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length] as string;
}

export function BookCover({ url, titolo, autore, className }: BookCoverProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const src = url?.trim();
  const showImage = Boolean(src) && !broken;
  const tone = `var(${paletteFor(titolo)})`;

  return (
    <div
      className={cn(
        "@container relative aspect-[2/3] shrink-0 overflow-hidden rounded-md border border-border/60 shadow-card",
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
          className="flex h-full w-full flex-col justify-between p-[8%]"
          style={{
            backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${tone} 42%, var(--card)), color-mix(in oklab, ${tone} 14%, var(--background)))`,
          }}
        >
          <span className="h-px w-1/3 bg-foreground/30" />
          <div className="grid gap-[0.35em] text-center">
            <span className="line-clamp-4 font-display text-[8px] font-medium leading-tight text-foreground/90 @[4.5rem]:text-[10px] @[7rem]:text-sm @[10rem]:text-lg">
              {titolo}
            </span>
            {autore && (
              <span className="line-clamp-2 text-[6px] uppercase tracking-wider text-foreground/60 @[4.5rem]:text-[8px] @[7rem]:text-[10px] @[10rem]:text-xs">
                {autore}
              </span>
            )}
          </div>
          <span className="ml-auto h-px w-1/3 bg-foreground/30" />
        </div>
      )}
    </div>
  );
}
