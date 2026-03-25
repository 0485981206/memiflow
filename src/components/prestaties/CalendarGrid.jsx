import React, { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { berekenPrestatieCodes, buildCodeMap } from "@/lib/prestatie-codes";
import PrestatieCodeLines from "./PrestatieCodeLines";

const DAY_NAMES = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function CalendarGrid({ currentMonth, prestaties, codes, onDayClick, selectedWerknemer }) {
  const codeMap = useMemo(() => buildCodeMap(codes), [codes]);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start with empty cells (Monday-based)
  const firstDayOfWeek = getDay(monthStart);
  const startPad = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const getPrestatiesForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return prestaties.filter((p) => p.datum === dateStr);
  };

  const mapBron = (bron) => {
    const map = { gps: "Hofkip", uitsnext: "Meat and More" };
    return map[bron?.toLowerCase()] || bron || "";
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="bg-muted/50 text-center py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card min-h-[80px] md:min-h-[100px]" />
        ))}
        {days.map((day) => {
          const dayPrestaties = getPrestatiesForDay(day);
          const weekend = getDay(day) === 0 || getDay(day) === 6;

          return (
            <div
              key={day.toISOString()}
              className={`bg-card min-h-[80px] md:min-h-[100px] p-1.5 cursor-pointer transition-colors hover:bg-muted/30 ${
                weekend ? "bg-muted/20" : ""
              } ${isToday(day) ? "ring-2 ring-inset ring-accent" : ""}`}
              onClick={() => onDayClick(day)}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday(day)
                    ? "text-accent font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayPrestaties.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="text-[10px] leading-tight font-medium px-1 py-0.5 rounded truncate bg-blue-500 text-white"
                    title={`${p.uren}u - ${p.eindklant_naam || p.firma || ""}`}
                  >
                    {p.uren}u {mapBron(p.bron)}
                  </div>
                ))}
                {dayPrestaties.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{dayPrestaties.length - 3} meer
                  </div>
                )}
              </div>
              {selectedWerknemer && (() => {
                const totalUren = dayPrestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
                const hasData = dayPrestaties.length > 0;
                const lines = berekenPrestatieCodes(
                  format(day, "yyyy-MM-dd"),
                  getDay(day),
                  hasData ? totalUren : null,
                  codeMap
                );
                return <PrestatieCodeLines lines={lines} />;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}