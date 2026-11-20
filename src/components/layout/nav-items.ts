import { BookMarked, BookOpenCheck, Home } from "lucide-react";

/** Main navigation, shared by the desktop sidebar and the mobile bottom bar. */
export const NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Da leggere", url: "/da-leggere", icon: BookMarked },
  { title: "Libri letti", url: "/libri-letti", icon: BookOpenCheck },
] as const;
