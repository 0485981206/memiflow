import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Save, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlanningDayEditor from "../components/planning/PlanningDayEditor";
import PlanningLogSheet from "../components/planning/PlanningLogSheet";

export default function Agendaplanning() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedKlant, setSelectedKlant] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten-actief"],
    queryFn: () => base44.entities.Eindklant.filter({ status: "actief" }),
  });

  // Auto-select first klant
  useEffect(() => {
    if (klanten.length > 0 && !selectedKlant) {
      setSelectedKlant(klanten[0].id);
    }
  }, [klanten]);

  const { data: werkspots = [] } = useQuery({
    queryKey: ["werkspots-klant", selectedKlant],
    queryFn: () => base44.entities.Werkspot.filter({ eindklant_id: selectedKlant, status: "actief" }),
    enabled: !!selectedKlant,
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setSelectedDate(addDays(selectedDate, -7));
  const nextWeek = () => setSelectedDate(addDays(selectedDate, 7));
  const goToday = () => setSelectedDate(new Date());

  const selectedKlantNaam = klanten.find(k => k.id === selectedKlant)?.naam || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Agendaplanning</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setLogOpen(true)}>
            <History className="w-4 h-4" /> Wijzigingslog
          </Button>
        </div>
      </div>

      {/* Klant selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-64">
          <Select value={selectedKlant} onValueChange={setSelectedKlant}>
            <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
            <SelectContent>
              {klanten.map(k => <SelectItem key={k.id} value={k.id}>{k.naam}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>Vandaag</Button>
          <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Week calendar */}
      {selectedKlant && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-lg text-center transition-all duration-150 active:scale-[0.97] select-none touch-manipulation border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : isToday
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <p className="text-xs font-medium">{format(day, "EEE", { locale: nl })}</p>
                <p className="text-lg font-bold">{format(day, "d")}</p>
                <p className="text-[10px]">{format(day, "MMM", { locale: nl })}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Day editor */}
      {selectedKlant && (
        <PlanningDayEditor
          datum={selectedDate}
          werkspots={werkspots}
          eindklantId={selectedKlant}
          eindklantNaam={selectedKlantNaam}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["werkspot-planning"] })}
        />
      )}

      {/* Log sheet */}
      <PlanningLogSheet
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
        eindklantId={selectedKlant}
      />
    </div>
  );
}