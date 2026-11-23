import { Badge } from "@/components/ui/badge";
import { STATO_BADGE, TIPO_LABEL, type Stato, type Tipo } from "@/lib/books";

export function StatoBadge({ stato }: { stato: Stato | null }) {
  if (!stato) return null;
  return (
    <Badge variant={STATO_BADGE[stato]} className="text-[10px] tracking-[0.14em]">
      {stato}
    </Badge>
  );
}

export function TipoBadge({ tipo }: { tipo: Tipo | null }) {
  if (!tipo) return null;
  return (
    <Badge variant="tipo" className="text-[10px] uppercase tracking-[0.1em]">
      {TIPO_LABEL[tipo]}
    </Badge>
  );
}
