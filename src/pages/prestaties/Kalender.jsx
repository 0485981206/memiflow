import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import CalendarGrid from "../../components/prestaties/CalendarGrid";
import WeekView from "../../components/prestaties/WeekView";
import DayView from "../../components/prestaties/DayView";
import PrestatieDialog from "../../components/prestaties/PrestatieDialog";
import WerknemerCombobox from "../../components/prestaties/WerknemerCombobox.jsx";

export default function Kalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("maand"); // maand | week | dag
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWerknemer, setSelectedWerknemer] = useState("");

  // For month query always use month of currentDate
  const currentMonth = currentDate;
  const maandStr = format(currentDate, "yyyy-MM");

  const { data: prestaties = [] } = useQuery({
    queryKey: ["prestaties", maandStr],
    queryFn: () => base44.entities.Prestatie.filter({ maand: maandStr }),
  });

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["prestatiecodes"],
    queryFn: () => base44.entities.PrestatieCode.list(),
  });

  const { data: plaatsingen = [] } = useQuery({
    queryKey: ["plaatsingen"],
    queryFn: () => base44.entities.Plaatsing.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Prestatie.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prestaties", maandStr] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Prestatie.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prestaties", maandStr] }),
  });

  const filteredPrestaties = selectedWerknemer
    ? prestaties.filter((p) => p.werknemer_id === selectedWerknemer)
    : [];

  const handleDayClick = (day) => {
    if (!selectedWerknemer) return;
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const dayPrestaties = selectedDay
    ? filteredPrestaties.filter(
        (p) => p.datum === format(selectedDay, "yyyy-MM-dd")
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalIcon className="w-6 h-6 text-accent" />
          Prestatie Kalender
        </h1>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (view === "maand") setCurrentDate(subMonths(currentDate, 1));
                else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
                else setCurrentDate(subDays(currentDate, 1));
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[160px] text-center capitalize">
              {view === "maand" && format(currentDate, "MMMM yyyy", { locale: nl })}
              {view === "week" && (() => {
                const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
                return `${format(ws, "d MMM", { locale: nl })} – ${format(addDays(ws, 6), "d MMM yyyy", { locale: nl })}`;
              })()}
              {view === "dag" && format(currentDate, "d MMMM yyyy", { locale: nl })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (view === "maand") setCurrentDate(addMonths(currentDate, 1));
                else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
                else setCurrentDate(addDays(currentDate, 1));
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 text-sm"
            >
              Vandaag
            </Button>
            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 ml-2">
                  <CalIcon className="w-4 h-4" />
                  {format(currentDate, "d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  disabled={(date) => false}
                />
              </PopoverContent>
            </Popover>
            {/* View toggle */}
            <div className="flex rounded-md border overflow-hidden ml-2">
              {["maand", "week", "dag"].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    view === v ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="w-64">
            <WerknemerCombobox
              werknemers={werknemers.filter((w) => !w.status || w.status === "actief")}
              value={selectedWerknemer}
              onChange={(id) => setSelectedWerknemer(id || "")}
              placeholder="Selecteer een werknemer..."
            />
            {!selectedWerknemer && (
              <p className="text-xs text-muted-foreground mt-1">Selecteer eerst een werknemer om prestaties in te geven.</p>
            )}
          </div>
        </div>

        {view === "maand" && (
          <CalendarGrid
            currentMonth={currentDate}
            prestaties={filteredPrestaties}
            codes={codes}
            onDayClick={handleDayClick}
            selectedWerknemer={selectedWerknemer}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            prestaties={filteredPrestaties}
            codes={codes}
            onDayClick={handleDayClick}
            selectedWerknemer={selectedWerknemer}
          />
        )}
        {view === "dag" && (
          <DayView
            currentDate={currentDate}
            prestaties={filteredPrestaties}
            codes={codes}
            onDayClick={handleDayClick}
          />
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
          {codes.map((c) => (
            <div key={c.code} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c.kleur || "#3b82f6" }}
              />
              <span className="text-muted-foreground">
                {c.code} — {c.naam}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <PrestatieDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDay}
        werknemers={werknemers}
        codes={codes}
        plaatsingen={plaatsingen}
        existingPrestaties={dayPrestaties}
        onSave={(data) => createMut.mutate(data)}
        onDelete={(id) => deleteMut.mutate(id)}
        selectedWerknemer={selectedWerknemer}
      />

      {/* Geïmporteerde records */}
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-accent" />
          Geïmporteerde records — {format(currentMonth, "MMMM yyyy", { locale: nl })}
        </h2>
        <Card className="overflow-hidden">
          {prestaties.filter(p => p.bron).length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Geen geïmporteerde records voor deze maand</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left p-2 font-semibold">Werknemer</th>
                    <th className="text-left p-2 font-semibold">Datum</th>
                    <th className="text-left p-2 font-semibold">Dag</th>
                    <th className="text-left p-2 font-semibold">Firma</th>
                    <th className="text-right p-2 font-semibold">Uren</th>
                    <th className="text-left p-2 font-semibold">In/Uit tijden</th>
                    <th className="text-left p-2 font-semibold">Bron</th>
                  </tr>
                </thead>
                <tbody>
                  {prestaties
                    .filter(p => p.bron)
                    .sort((a, b) => (a.datum || "").localeCompare(b.datum || ""))
                    .map((p, i) => {
                      const tijden = [1,2,3,4,5,6].map(n => {
                        const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
                        return inn ? `${inn}–${uit || "?"}` : null;
                      }).filter(Boolean).join(" | ");
                      return (
                        <tr key={p.id || i} className="border-t hover:bg-muted/30">
                          <td className="p-2 font-medium">{p.werknemer_naam || "—"}</td>
                          <td className="p-2">{p.datum}</td>
                          <td className="p-2 text-muted-foreground">{p.dag || "—"}</td>
                          <td className="p-2 text-muted-foreground">{p.firma || "—"}</td>
                          <td className="p-2 text-right font-medium">{p.totaal_uren ?? p.uren ?? "—"}</td>
                          <td className="p-2 text-muted-foreground font-mono">{tijden || "—"}</td>
                          <td className="p-2">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                              <Clock className="w-2.5 h-2.5" />{p.bron}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}