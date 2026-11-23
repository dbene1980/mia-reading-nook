import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, CalendarRange, Library, Star, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/library/empty-state";
import { PageHeader } from "@/components/library/page-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TIPO_LABEL, readingStats, readingYears, type YearFilter } from "@/lib/books";
import { useBooks } from "@/lib/books-data";
import { cn } from "@/lib/utils";

const TITLE = "Statistiche · La Libreria di Daniele";
const DESCRIPTION = "Quanti libri leggi al mese, voti medi, formati preferiti e andamento dell'anno.";

export const Route = createFileRoute("/_authenticated/statistiche")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: StatsPage,
});

const chartConfig = { libri: { label: "Libri", color: "var(--chart-1)" } } satisfies ChartConfig;
const fmt = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

function StatsPage() {
  const { books, isLoading } = useBooks();
  const [year, setYear] = useState<YearFilter>(new Date().getFullYear());
  const years = useMemo(() => readingYears(books), [books]);
  const s = useMemo(() => readingStats(books, year), [books, year]);
  const yearLabel = year === "ALL" ? "di sempre" : `nel ${year}`;
  const maxRating = Math.max(1, ...s.byRating.map((r) => r.count));

  const diff = s.previousYearTotal === null ? null : s.total - s.previousYearTotal;

  return (
    <AppShell>
      <div className="grid gap-8">
        <PageHeader
          eyebrow="Le tue letture"
          title="Statistiche"
          actions={
            <Select value={String(year)} onValueChange={(v) => setYear(v === "ALL" ? "ALL" : Number(v))}>
              <SelectTrigger className="w-44" aria-label="Anno">
                <CalendarRange className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
                <SelectItem value="ALL">Tutti gli anni</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={CalendarRange} label="Media libri al mese" value={fmt(s.avgPerMonth)} index={0}>
                {year === "ALL" ? "dal primo libro finito" : `su ${year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12} mesi`}
              </Kpi>
              <Kpi icon={BookOpenCheck} label={`Libri letti ${yearLabel}`} value={String(s.total)} index={1}>
                {diff === null ? (
                  "tutti gli anni insieme"
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      diff > 0 && "text-success",
                      diff < 0 && "text-destructive",
                    )}
                  >
                    {diff >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {diff > 0 ? "+" : ""}
                    {diff} rispetto al {Number(year) - 1} ({s.previousYearTotal})
                  </span>
                )}
              </Kpi>
              <Kpi
                icon={Star}
                label="Valutazione media"
                value={s.avgRating === null ? "—" : fmt(s.avgRating)}
                suffix={s.avgRating === null ? undefined : "/ 5"}
                index={2}
              >
                {s.ratedCount === 1 ? "1 libro votato" : `${s.ratedCount} libri votati`}
              </Kpi>
              <Kpi
                icon={Library}
                label="Formato preferito"
                value={s.favoriteFormat ? TIPO_LABEL[s.favoriteFormat] : "—"}
                index={3}
                small
              >
                {s.formats
                  .filter((f) => f.tipo !== "FUMETTO" || f.count > 0)
                  .map((f) => `${TIPO_LABEL[f.tipo]} ${f.pct}%`)
                  .join(" · ")}
              </Kpi>
            </div>

            {s.total === 0 ? (
              <EmptyState title="Nessun libro letto">
                {year === "ALL"
                  ? "Quando segnerai un libro come letto, qui compariranno le statistiche."
                  : `Non risultano libri finiti nel ${year}. Prova un altro anno.`}
              </EmptyState>
            ) : (
              <>
                <section className="grid gap-4 ink-card p-4 shadow-card sm:p-6">
                  <div>
                    <h2 className="text-xl">Libri letti per mese</h2>
                    <p className="text-sm text-muted-foreground">
                      {year === "ALL" ? "Tutti gli anni sommati per mese" : `Gennaio – dicembre ${year}`}
                    </p>
                  </div>
                  <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
                    <BarChart data={s.byMonth} margin={{ left: -20, right: 4, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="mese" tickLine={false} axisLine={false} interval={0} fontSize={11} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="libri" fill="var(--color-libri)" radius={[2, 2, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ChartContainer>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <section className="grid content-start gap-4 ink-card p-4 shadow-card sm:p-6">
                    <h2 className="text-xl">Per numero di stelle</h2>
                    <div className="grid gap-2.5">
                      {[...s.byRating].reverse().map((r) => (
                        <DistributionRow
                          key={r.stelle}
                          label={
                            <span className="flex items-center gap-0.5 text-star" aria-label={`${r.stelle} stelle`}>
                              {Array.from({ length: r.stelle }).map((_, i) => (
                                <Star key={i} className="size-3.5 fill-current" />
                              ))}
                            </span>
                          }
                          count={r.count}
                          ratio={r.count / maxRating}
                          barClass="bg-star"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.total - s.ratedCount > 0 ? `${s.total - s.ratedCount} libri senza voto` : "Tutti i libri hanno un voto"}
                    </p>
                  </section>

                  <section className="grid content-start gap-4 ink-card p-4 shadow-card sm:p-6">
                    <h2 className="text-xl">Per formato</h2>
                    <div className="grid gap-2.5">
                      {s.formats.map((f) => (
                        <DistributionRow
                          key={f.tipo}
                          label={<span className="text-sm">{TIPO_LABEL[f.tipo]}</span>}
                          count={f.count}
                          ratio={f.pct / 100}
                          extra={`${f.pct}%`}
                          barClass="bg-gold"
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  suffix,
  children,
  index,
  small,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string | undefined;
  children: ReactNode;
  index: number;
  small?: boolean;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="flex animate-rise flex-col ink-card p-4 shadow-card sm:p-5"
    >
      <Icon className="size-5 text-gold" />
      <p
        className={cn(
          "mt-4 font-display font-semibold tabular-nums",
          small ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
        )}
      >
        {value}
        {suffix && <span className="ml-1 text-base text-muted-foreground">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm text-foreground/90">{label}</p>
      <p className="mt-2 text-xs leading-snug text-muted-foreground">{children}</p>
    </div>
  );
}

function DistributionRow({
  label,
  count,
  ratio,
  extra,
  barClass,
}: {
  label: ReactNode;
  count: number;
  ratio: number;
  extra?: string;
  barClass: string;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
      {label}
      <div className="h-2 overflow-hidden rounded-[2px] border border-line/40 bg-background">
        <div className={cn("h-full transition-all", barClass)} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-right text-xs tabular-nums text-muted-foreground">
        {count}
        {extra && <span className="ml-1.5 text-foreground/80">{extra}</span>}
      </span>
    </div>
  );
}
