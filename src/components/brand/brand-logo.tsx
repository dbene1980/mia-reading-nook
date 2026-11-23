import { cn } from "@/lib/utils";

/** The app icon (bookshelf + 4-point star, tattoo flash style), same file as favicon/PWA icon. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/icon.svg"
      alt=""
      aria-hidden
      width={40}
      height={40}
      className={cn("size-10 shrink-0 rounded-full", className)}
    />
  );
}
