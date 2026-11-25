import { BarChart3, BookMarked, BookOpenCheck, Home, Sparkles } from "lucide-react";

/** Main navigation, shared by the desktop sidebar and the mobile bottom bar. */
export const NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Da leggere", url: "/da-leggere", icon: BookMarked },
  { title: "Libri letti", url: "/libri-letti", icon: BookOpenCheck },
  { title: "Statistiche", url: "/statistiche", icon: BarChart3 },
  { title: "Consigli AI", url: "/consigli-ai", icon: Sparkles },
] as const;
