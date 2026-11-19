import { BookOpen } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface BookCoverProps {
  url: string | null;
  titolo: string;
  className?: string;
}

export function BookCover({ url, titolo, className }: BookCoverProps) {
  const [broken, setBroken] = useState(false);
  const showImage = url && !broken;
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-cover-fallback",
        className,
      )}
    >
      {showImage ? (
        <img
          src={url}
          alt={`Copertina di ${titolo}`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 px-2 text-center">
          <BookOpen className="size-5 text-primary/70" />
          <span className="line-clamp-3 font-display text-[11px] leading-tight text-foreground/70">
            {titolo}
          </span>
        </div>
      )}
    </div>
  );
}
