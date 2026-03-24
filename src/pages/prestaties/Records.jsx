import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, FileText, AlertTriangle } from "lucide-react";

export default function Records() {
  const { data: prestaties = [], isLoading } = useQuery({
    queryKey: ["prestaties"],
    queryFn: () => base44.entities.Prestatie.list("-created_date", 1000),
  });

  const geimporteerd = prestaties
    .filter(p => p.bron)
    .sort((a, b) => (a.datum || "").localeCompare(b.datum || ""));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-accent" />
        Geïmporteerde Records
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{geimporteerd.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Dagrecords</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {new Set(geimporteerd.map(p => p.werknemer_id)).size}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Werknemers</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {Math.round(geimporteerd.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0) * 100) / 100}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Totaal uren</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Laden...</div>
        ) : geimporteerd.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
            Geen geïmporteerde records
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-semibold">Werknemer</th>
                  <th className="text-left p-2 font-semibold">Extern ID</th>
                  <th className="text-left p-2 font-semibold">Datum</th>
                  <th className="text-left p-2 font-semibold">Dag</th>
                  <th className="text-left p-2 font-semibold">Firma</th>
                  <th className="text-right p-2 font-semibold">Uren</th>
                  <th className="text-left p-2 font-semibold">In/Uit tijden</th>
                  <th className="text-left p-2 font-semibold">Bron</th>
                </tr>
              </thead>
              <tbody>
                {geimporteerd.map((p, i) => {
                  const tijden = [1, 2, 3, 4, 5, 6].map(n => {
                    const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
                    return inn ? `${inn}–${uit || "?"}` : null;
                  }).filter(Boolean).join(" | ");
                  return (
                    <tr key={p.id || i} className="border-t hover:bg-muted/30">
                      <td className="p-2 font-medium">{p.werknemer_naam || "—"}</td>
                      <td className="p-2 font-mono text-muted-foreground">{p.externe_id || "—"}</td>
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
  );
}