import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, X, Filter } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { nl } from "date-fns/locale";
import KlantCombobox from "../klanten/KlantCombobox";
import WerknemerCombobox from "../prestaties/WerknemerCombobox";

const PRESETS = [
  { label: "Deze maand", get: () => [startOfMonth(new Date()), new Date()] },
  { label: "Vorige maand", get: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] },
  { label: "Laatste 7 dagen", get: () => [subDays(new Date(), 6), new Date()] },
  { label: "Laatste 30 dagen", get: () => [subDays(new Date(), 29), new Date()] },
  { label: "Laatste 90 dagen", get: () => [subDays(new Date(), 89), new Date()] },
  { label: "Dit jaar", get: () => [new Date(new Date().getFullYear(), 0, 1), new Date()] },
];

export default function DashboardFilters({
  dateRange, setDateRange,
  selectedKlant, setSelectedKlant, klanten,
  selectedWerknemer, setSelectedWerknemer, werknemers,
}) {
  const hasFilters = selectedKlant || selectedWerknemer;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        {/* Row 1: date range + presets */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground mr-1">Periode:</span>

          {/* From date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <CalendarDays className="w-3.5 h-3.5" />
                {dateRange.from ? format(dateRange.from, "d MMM yyyy", { locale: nl }) : "Van"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(d) => d && setDateRange((prev) => ({ ...prev, from: d }))}
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground">—</span>

          {/* To date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <CalendarDays className="w-3.5 h-3.5" />
                {dateRange.to ? format(dateRange.to, "d MMM yyyy", { locale: nl }) : "Tot"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(d) => d && setDateRange((prev) => ({ ...prev, to: d }))}
              />
            </PopoverContent>
          </Popover>

          {/* Presets */}
          <div className="flex flex-wrap gap-1 ml-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => {
                  const [from, to] = p.get();
                  setDateRange({ from, to });
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Row 2: entity filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            <KlantCombobox
              klanten={klanten}
              value={selectedKlant}
              onChange={(id) => setSelectedKlant(id || "")}
              placeholder="Alle klanten"
            />
          </div>
          <div className="w-56">
            <WerknemerCombobox
              werknemers={werknemers}
              value={selectedWerknemer}
              onChange={(id) => setSelectedWerknemer(id || "")}
              placeholder="Alle werknemers"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-destructive"
              onClick={() => { setSelectedKlant(""); setSelectedWerknemer(""); }}
            >
              <X className="w-3 h-3" /> Wis filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}