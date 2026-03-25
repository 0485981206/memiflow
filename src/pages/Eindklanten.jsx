import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronLeft, ChevronRight, Calendar, List, Clock, Users } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, parseISO, startOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import KlantCombobox from "@/components/klanten/KlantCombobox";

const PRESTATIE_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

function getWerknemerColor(index) {
  return PRESTATIE_COLORS[index % PRESTATIE_COLORS.length];
}

const DAGEN = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function Eindklanten() {
  const [selectedKlant, setSelectedKlant] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("kalender"); // kalender | week | lijst

  const maandStr = format(currentDate, "yyyy-MM");

  // Week helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list("-created_date"),
  });

  const { data: allePrestaties = [], isLoading } = useQuery({
    queryKey: ["prestaties-maand", maandStr],
    queryFn: () => base44.entities.Prestatie.filter({ maand: maandStr }),
    enabled: !!selectedKlant,
  });

  const prestaties = allePrestaties.filter(
    (p) =>
      p.eindklant_id === selectedKlant?.id ||
      (p.eindklant_naam || "").toLowerCase() === (selectedKlant?.naam || "").toLowerCase()
  );

  // Group by werknemer
  const werknemerGroepen = prestaties.reduce((acc, p) => {
    const key = p.werknemer_naam || p.werknemer_id || "Onbekend";
    if (!acc[key]) acc[key] = { naam: key, prestaties: [] };
    acc[key].prestaties.push(p);
    return acc;
  }, {});
  const werknemers = Object.values(werknemerGroepen).sort((a, b) => a.naam.localeCompare(b.naam));

  // Calendar helpers
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  // Monday-based padding
  const startPad = (getDay(firstDay) + 6) % 7;

  const prestatiesOpDag = (datum) =>
    prestaties.filter((p) => p.datum === datum);

  const totaalUren = prestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold">Klanten</h1>
      </div>

      {/* Klant selector */}
      <div className="max-w-sm">
        <KlantCombobox
          klanten={klanten}
          value={selectedKlant?.id || ""}
          onChange={(id) => setSelectedKlant(klanten.find((k) => k.id === id) || null)}
          placeholder="Selecteer een klant..."
        />
      </div>

      {!selectedKlant ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-base">Selecteer een klant om de prestatie-records te bekijken.</p>
        </div>
      ) : (
        <Card className="p-4 space-y-4">
          {/* Header + nav */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize min-w-[160px] text-center">
                {view === "week" ? format(weekStart, "MMMM yyyy", { locale: nl }) : format(currentDate, "MMMM yyyy", { locale: nl })}
              </h2>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Vandaag</Button>
              {view === "week" && (
                <span className="text-sm text-muted-foreground">
                  {format(weekStart, "d MMM", { locale: nl })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {werknemers.length}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totaalUren.toFixed(1)}u</span>
              </div>
              {/* View toggle */}
              <div className="flex rounded-md border overflow-hidden">
                <button
                  onClick={() => setView("kalender")}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${view === "kalender" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Kalender
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Week
                </button>
                <button
                  onClick={() => setView("lijst")}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${view === "lijst" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <List className="w-3.5 h-3.5" /> Lijst
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Laden...</div>
          ) : prestaties.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Geen records gevonden voor deze maand.</div>
          ) : view === "kalender" ? (
            <KalenderView days={days} startPad={startPad} prestatiesOpDag={prestatiesOpDag} werknemers={werknemers} />
          ) : view === "week" ? (
            <WeekView weekDays={weekDays} prestatiesOpDag={prestatiesOpDag} werknemers={werknemers} />
          ) : (
            <LijstView werknemers={werknemers} />
          )}
        </Card>
      )}
    </div>
  );
}

function KalenderView({ days, startPad, prestatiesOpDag, werknemers }) {
  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAGEN.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-muted/30 min-h-[70px]" />
        ))}
        {days.map((day) => {
          const dagStr = format(day, "yyyy-MM-dd");
          const dagPrestaties = prestatiesOpDag(dagStr);
          return (
            <div
              key={dagStr}
              className={`bg-card min-h-[70px] p-1.5 ${isToday(day) ? "ring-2 ring-inset ring-accent" : ""}`}
            >
              <p className={`text-xs font-medium mb-1 ${isToday(day) ? "text-accent font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dagPrestaties.slice(0, 3).map((p, i) => {
                  const wIdx = werknemers.findIndex((w) => w.naam === (p.werknemer_naam || p.werknemer_id || "Onbekend"));
                  return (
                    <div key={p.id} className={`text-[10px] rounded px-1 py-0.5 truncate ${getWerknemerColor(wIdx)}`}>
                      {p.werknemer_naam?.split(" ")[0] || "?"} {p.totaal_uren || p.uren || 0}u
                    </div>
                  );
                })}
                {dagPrestaties.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dagPrestaties.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {werknemers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          {werknemers.map((w, i) => (
            <div key={w.naam} className="flex items-center gap-1 text-xs">
              <div className={`w-3 h-3 rounded-full ${getWerknemerColor(i).split(" ")[0]}`} />
              <span className="text-muted-foreground">{w.naam}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekView({ weekDays, prestatiesOpDag, werknemers }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDays.map((day) => {
          const dagStr = format(day, "yyyy-MM-dd");
          const dagPrestaties = prestatiesOpDag(dagStr);
          const isWeekend = [6, 0].includes(day.getDay());
          return (
            <div
              key={dagStr}
              className={`min-h-[120px] p-2 ${isWeekend ? "bg-muted/40" : "bg-card"} ${isToday(day) ? "ring-2 ring-inset ring-accent" : ""}`}
            >
              <div className={`text-xs font-semibold mb-1.5 ${isToday(day) ? "text-accent" : "text-muted-foreground"}`}>
                <div className="capitalize">{format(day, "EEE", { locale: nl })}</div>
                <div className={`text-base leading-none ${isToday(day) ? "text-accent" : "text-foreground"}`}>{format(day, "d")}</div>
              </div>
              <div className="space-y-0.5">
                {dagPrestaties.map((p) => {
                  const wIdx = werknemers.findIndex((w) => w.naam === (p.werknemer_naam || p.werknemer_id || "Onbekend"));
                  const uren = p.totaal_uren || p.uren || 0;
                  return (
                    <div key={p.id} className={`text-[10px] rounded px-1 py-0.5 truncate ${getWerknemerColor(wIdx)}`}>
                      {p.werknemer_naam?.split(" ")[0] || "?"} {uren}u
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {werknemers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          {werknemers.map((w, i) => (
            <div key={w.naam} className="flex items-center gap-1 text-xs">
              <div className={`w-3 h-3 rounded-full ${getWerknemerColor(i).split(" ")[0]}`} />
              <span className="text-muted-foreground">{w.naam}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LijstView({ werknemers }) {
  return (
    <div className="space-y-4">
      {werknemers.map((w, wIdx) => {
        const totaal = w.prestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
        const sorted = [...w.prestaties].sort((a, b) => a.datum.localeCompare(b.datum));
        return (
          <div key={w.naam} className="border rounded-lg overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-2.5 ${getWerknemerColor(wIdx)}`}>
              <span className="font-semibold text-sm">{w.naam}</span>
              <div className="flex items-center gap-3 text-xs">
                <span>{w.prestaties.length} records</span>
                <span className="font-bold">{totaal.toFixed(1)}u totaal</span>
              </div>
            </div>
            <div className="divide-y">
              {sorted.map((p) => {
                const tijden = [1,2,3,4,5,6].map(n => {
                  const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
                  return inn ? `${inn}–${uit || "?"}` : null;
                }).filter(Boolean);
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-muted-foreground w-24 shrink-0">
                        {format(parseISO(p.datum), "EEE d MMM", { locale: nl })}
                      </span>
                      {tijden.length > 0 && (
                        <span className="text-xs hidden sm:block">
                          {tijden.map((t, i) => (
                            <span key={i} className={t.includes("?") ? "text-red-600 font-medium" : "text-muted-foreground"}>
                              {i > 0 && " | "}{t.includes("?") ? "⚠ " : ""}{t}
                            </span>
                          ))}
                        </span>
                      )}
                      {p.code && <Badge variant="secondary" className="text-xs">{p.code}</Badge>}
                    </div>
                    <span className="font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {(p.totaal_uren || p.uren || 0).toFixed(1)}u
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}