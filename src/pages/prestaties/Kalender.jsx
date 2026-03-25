import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, startOfWeek, parseISO } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Info } from "lucide-react";
import WerknemerDetail from "../../components/werknemers/WerknemerDetail";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import CalendarGrid from "../../components/prestaties/CalendarGrid";
import WeekView from "../../components/prestaties/WeekView";
import DayView from "../../components/prestaties/DayView";
import PrestatieDialog from "../../components/prestaties/PrestatieDialog";
import WerknemerCombobox from "../../components/prestaties/WerknemerCombobox.jsx";

export default function Kalender() {
  const [searchParams] = useSearchParams();
  const paramWerknemerId = searchParams.get("werknemer_id");
  const paramDate = searchParams.get("date");

  const [currentDate, setCurrentDate] = useState(paramDate ? parseISO(paramDate) : new Date());
  const [view, setView] = useState("maand"); // maand | week | dag
  const [selectedDay, setSelectedDay] = useState(paramDate ? parseISO(paramDate) : null);
  const [dialogOpen, setDialogOpen] = useState(paramDate ? true : false);
  const [selectedWerknemer, setSelectedWerknemer] = useState(paramWerknemerId || "");
  const [werknemerDetailOpen, setWerknemerDetailOpen] = useState(false);

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

  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Prestatie.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prestaties", maandStr] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Prestatie.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prestaties", maandStr] }),
  });

  const handleWerknemerSave = async (id, data) => {
    await base44.entities.Werknemer.update(id, data);
    queryClient.invalidateQueries({ queryKey: ["werknemers"] });
  };

  const handleWerknemerDelete = async (id) => {
    await base44.entities.Werknemer.delete(id);
    queryClient.invalidateQueries({ queryKey: ["werknemers"] });
    setSelectedWerknemer("");
    setWerknemerDetailOpen(false);
  };

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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalIcon className="w-6 h-6 text-accent" />
          Prestatie Kalender
        </h1>
        {selectedWerknemer && (() => {
          const w = werknemers.find(wn => wn.id === selectedWerknemer);
          return w ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-muted-foreground">—</span>
              <span className="text-lg font-semibold">{w.voornaam} {w.achternaam}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWerknemerDetailOpen(true)}>
                <Info className="w-4 h-4 text-accent" />
              </Button>
            </div>
          ) : null;
        })()}
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

          <div className="flex items-center gap-2">
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
            <Button
              size="icon"
              variant="outline"
              className="shrink-0"
              disabled={!selectedWerknemer}
              onClick={() => setWerknemerDetailOpen(true)}
              title="Werknemer details"
            >
              <Info className="w-4 h-4 text-accent" />
            </Button>
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

      {werknemerDetailOpen && selectedWerknemer && (() => {
        const w = werknemers.find(wn => wn.id === selectedWerknemer);
        return w ? (
          <WerknemerDetail
            werknemer={w}
            onClose={() => setWerknemerDetailOpen(false)}
            onSave={handleWerknemerSave}
            onDelete={handleWerknemerDelete}
          />
        ) : null;
      })()}

    </div>
  );
}