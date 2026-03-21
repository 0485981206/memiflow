import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function groupByWerknemer(regels) {
  const map = {};
  for (const r of regels) {
    const key = r.werknemer_naam;
    if (!map[key]) map[key] = { naam: r.werknemer_naam, werknemer_id: r.werknemer_id, niet_gevonden: r.werknemer_niet_gevonden, regels: [] };
    map[key].regels.push(r);
  }
  return Object.values(map).sort((a, b) => a.naam.localeCompare(b.naam));
}

export default function ReviewOffCanvas({ batch, onClose, onGoedgekeurd }) {
  const [expanded, setExpanded] = useState({});
  const [codeOverride, setCodeOverride] = useState({});
  const [isGoedkeuring, setIsGoedkeuring] = useState(false);
  const queryClient = useQueryClient();

  const { data: regels = [], isLoading } = useQuery({
    queryKey: ["conceptregels", batch?.id],
    queryFn: () => base44.entities.PrestatieConceptRegel.filter({ batch_id: batch.id }),
    enabled: !!batch,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["prestatiecodes"],
    queryFn: () => base44.entities.PrestatieCode.list(),
  });

  const { data: plaatsingen = [] } = useQuery({
    queryKey: ["plaatsingen"],
    queryFn: () => base44.entities.Plaatsing.list(),
  });

  const grouped = groupByWerknemer(regels);
  const conceptRegels = regels.filter(r => r.status === "concept" || !r.status);
  const allHaveCode = conceptRegels.every(r => codeOverride[r.id] || r.code);

  const handleGoedkeuren = async () => {
    setIsGoedkeuring(true);
    for (const regel of conceptRegels) {
      const code = codeOverride[regel.id] || regel.code || "R";
      // Zoek plaatsing
      const plaatsing = plaatsingen.find(p =>
        p.werknemer_id === regel.werknemer_id && p.status === "actief"
      );
      await base44.entities.Prestatie.create({
        werknemer_id: regel.werknemer_id,
        werknemer_naam: regel.werknemer_naam,
        eindklant_id: regel.eindklant_id || plaatsing?.eindklant_id || "",
        eindklant_naam: regel.eindklant_naam || plaatsing?.eindklant_naam || "",
        plaatsing_id: regel.plaatsing_id || plaatsing?.id || "",
        datum: regel.datum,
        code: code,
        uren: regel.uren,
        opmerking: regel.opmerking || "",
        status: "ingevoerd",
        maand: regel.datum?.slice(0, 7) || "",
      });
      await base44.entities.PrestatieConceptRegel.update(regel.id, { status: "goedgekeurd", code });
    }
    await base44.entities.PrestatieImportBatch.update(batch.id, {
      status: "goedgekeurd",
      aantal_goedgekeurd: conceptRegels.length,
    });
    queryClient.invalidateQueries({ queryKey: ["prestaties"] });
    queryClient.invalidateQueries({ queryKey: ["importbatches"] });
    setIsGoedkeuring(false);
    onGoedgekeurd();
  };

  if (!batch) return null;

  const isReadOnly = batch.status === "goedgekeurd";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{batch.bestandsnaam}</h2>
            <p className="text-sm text-muted-foreground">
              {isReadOnly ? `${batch.aantal_goedgekeurd || 0} prestaties goedgekeurd` : `${conceptRegels.length} regels ter review`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Laden...
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-center text-muted-foreground">Geen regels gevonden.</p>
          ) : (
            grouped.map((groep) => (
              <div key={groep.naam} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={() => setExpanded(e => ({ ...e, [groep.naam]: !e[groep.naam] }))}
                >
                  <div className="flex items-center gap-2">
                    {groep.niet_gevonden ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <span className="font-medium text-sm">{groep.naam}</span>
                    <Badge variant="outline" className="text-xs">{groep.regels.length} dagen</Badge>
                    {groep.niet_gevonden && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">Niet gevonden</Badge>
                    )}
                  </div>
                  {expanded[groep.naam] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expanded[groep.naam] && (
                  <div className="divide-y">
                    {groep.regels.sort((a, b) => a.datum.localeCompare(b.datum)).map((regel) => {
                      const selectedCode = codeOverride[regel.id] || regel.code || "";
                      const isApproved = regel.status === "goedgekeurd";
                      return (
                        <div key={regel.id} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isApproved ? "bg-green-50" : ""}`}>
                          <span className="w-28 text-muted-foreground shrink-0">
                            {format(parseISO(regel.datum), "EEE d MMM", { locale: nl })}
                          </span>
                          <span className="w-16 font-medium shrink-0">{regel.uren}u</span>
                          {isReadOnly || isApproved ? (
                            <Badge className="text-xs" style={{ backgroundColor: codes.find(c => c.code === selectedCode)?.kleur || "#6b7280", color: "white" }}>
                              {selectedCode || "—"}
                            </Badge>
                          ) : (
                            <select
                              value={selectedCode}
                              onChange={(e) => setCodeOverride(prev => ({ ...prev, [regel.id]: e.target.value }))}
                              className="flex h-7 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">Kies code</option>
                              {codes.map(c => (
                                <option key={c.code} value={c.code}>{c.code} — {c.naam}</option>
                              ))}
                            </select>
                          )}
                          {isApproved && <Check className="w-4 h-4 text-green-500 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="border-t px-5 py-4 flex items-center justify-between bg-background">
            <div className="text-sm text-muted-foreground">
              {!allHaveCode && <span className="text-yellow-600">⚠ Nog niet alle regels hebben een code</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annuleren</Button>
              <Button
                onClick={handleGoedkeuren}
                disabled={isGoedkeuring || conceptRegels.length === 0}
                className="gap-2"
              >
                {isGoedkeuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isGoedkeuring ? "Importeren..." : `Goedkeuren & importeren`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}