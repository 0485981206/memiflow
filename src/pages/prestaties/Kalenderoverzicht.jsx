import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isWeekend, isSameDay
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Grid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CODE_COLORS = {
  P: { bg: "#86efac", text: "#166534", label: "Prestaties" },
  V: { bg: "#fde68a", text: "#92400e", label: "Vakantie" },
  Z: { bg: "#fca5a5", text: "#991b1b", label: "Ziekte" },
  O: { bg: "#93c5fd", text: "#1e40af", label: "Overuren" },
  N: { bg: "#c4b5fd", text: "#5b21b6", label: "Nacht" },
};

const WEEKEND_BG = "#d1d5db";
const MULTI_BG = "#6b7280";
const EMPTY_BG = "#f3f4f6";

export default function Kalenderoverzicht() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const maandStr = format(currentMonth, "yyyy-MM");

  const { data: prestaties = [] } = useQuery({
    queryKey: ["prestaties", maandStr],
    queryFn: () => base44.entities.Prestatie.filter({ maand: maandStr }),
  });

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Build a map: werknemer_id -> date -> [codes]
  const prestatieMap = useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      if (!map[p.werknemer_id]) map[p.werknemer_id] = {};
      if (!map[p.werknemer_id][p.datum]) map[p.werknemer_id][p.datum] = [];
      map[p.werknemer_id][p.datum].push(p.code);
    });
    return map;
  }, [prestaties]);

  // Only show werknemers who have prestaties this month OR are active
  const activeWerknemers = useMemo(() => {
    return werknemers
      .filter((w) => !w.status || w.status === "actief")
      .sort((a, b) => `${a.achternaam} ${a.voornaam}`.localeCompare(`${b.achternaam} ${b.voornaam}`));
  }, [werknemers]);

  const getCellInfo = (werknemerId, day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const codes = prestatieMap[werknemerId]?.[dateStr] || [];
    return codes;
  };

  const renderCell = (werknemerId, day) => {
    const codes = getCellInfo(werknemerId, day);
    const weekend = isWeekend(day);

    if (weekend && codes.length === 0) {
      return <div className="w-full h-full rounded-sm" style={{ backgroundColor: WEEKEND_BG }} />;
    }

    if (codes.length === 0) {
      return <div className="w-full h-full rounded-sm" style={{ backgroundColor: EMPTY_BG }} />;
    }

    if (codes.length > 1) {
      return (
        <div
          className="w-full h-full rounded-sm flex items-center justify-center text-white text-[9px] font-bold"
          style={{ backgroundColor: MULTI_BG }}
          title={codes.join(", ")}
        >
          ≡
        </div>
      );
    }

    const code = codes[0];
    const color = CODE_COLORS[code] || { bg: "#3b82f6", text: "#fff" };
    return (
      <div
        className="w-full h-full rounded-sm flex items-center justify-center text-[9px] font-bold"
        style={{ backgroundColor: color.bg, color: color.text }}
        title={code}
      >
        {code}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Grid className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold">Kalenderoverzicht</h1>
      </div>

      <Card className="p-4 overflow-x-auto">
        {/* Month navigation */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: nl })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Vandaag
          </Button>
        </div>

        {/* Table */}
        <div className="min-w-max">
          {/* Header: day numbers */}
          <div className="flex">
            <div className="w-44 flex-shrink-0" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`w-7 flex-shrink-0 text-center text-[10px] font-semibold pb-1 ${
                  isWeekend(day) ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                <div>{format(day, "d")}</div>
                <div className="text-[9px] font-normal text-muted-foreground capitalize">
                  {format(day, "EEE", { locale: nl }).slice(0, 2)}
                </div>
              </div>
            ))}
          </div>

          {/* Rows per werknemer */}
          {activeWerknemers.map((w) => (
            <div key={w.id} className="flex items-center mb-0.5">
              <div className="w-44 flex-shrink-0 pr-2 text-xs truncate text-primary font-medium" title={`${w.voornaam} ${w.achternaam}${w.overeenkomstnummer ? ` (${w.overeenkomstnummer})` : ""}`}>
                {w.voornaam} {w.achternaam}
                {w.overeenkomstnummer && (
                  <span className="ml-1 text-muted-foreground font-normal">({w.overeenkomstnummer})</span>
                )}
              </div>
              {days.map((day) => (
                <div key={day.toISOString()} className="w-7 h-6 flex-shrink-0 px-0.5 py-0.5">
                  {renderCell(w.id, day)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t text-xs">
          {Object.entries(CODE_COLORS).map(([code, color]) => (
            <div key={code} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: color.bg, color: color.text }}>
                {code}
              </div>
              <span className="text-muted-foreground">{color.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: MULTI_BG }}>
              ≡
            </div>
            <span className="text-muted-foreground">Meerdere</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: WEEKEND_BG }} />
            <span className="text-muted-foreground">Weekend</span>
          </div>
        </div>
      </Card>
    </div>
  );
}