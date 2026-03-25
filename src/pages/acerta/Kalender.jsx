import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CalendarGrid from "../../components/prestaties/CalendarGrid";
import PrestatieDialog from "../../components/prestaties/PrestatieDialog";
import WerknemerCombobox from "../../components/prestaties/WerknemerCombobox.jsx";

export default function AcertaKalender() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWerknemer, setSelectedWerknemer] = useState("");
  const queryClient = useQueryClient();

  const maandStr = format(currentMonth, "yyyy-MM");

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

  const berekenMut = useMutation({
    mutationFn: () => base44.functions.invoke('berekenAcertaCodes', { maand: maandStr }),
    onSuccess: (res) => {
      toast.success(`${res.data.codes_aangemaakt} Acerta codes berekend en opgeslagen`);
    },
    onError: (err) => {
      toast.error('Fout bij berekenen: ' + (err?.response?.data?.error || err.message));
    },
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
          Acerta Kalender
        </h1>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[160px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: nl })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="ml-2 text-sm"
            >
              Vandaag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => berekenMut.mutate()}
              disabled={berekenMut.isPending}
              className="gap-2"
            >
              {berekenMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Codes Berekenen & Opslaan
            </Button>
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

        <CalendarGrid
          currentMonth={currentMonth}
          prestaties={filteredPrestaties}
          codes={codes}
          onDayClick={handleDayClick}
          selectedWerknemer={selectedWerknemer}
        />

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
    </div>
  );
}