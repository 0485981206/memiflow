import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, ChevronDown, ChevronRight, Users, Clock } from "lucide-react";

export default function Eindklanten() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  const { data: klanten = [], isLoading: loadingKlanten } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list("-created_date"),
  });

  const { data: prestaties = [], isLoading: loadingPrestaties } = useQuery({
    queryKey: ["allePresaties"],
    queryFn: () => base44.entities.Prestatie.list("-datum", 2000),
  });

  const filtered = klanten.filter((k) =>
    (k.naam || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group prestaties by eindklant_id, then by werknemer
  const getKlantData = (klantId) => {
    const klantPrestaties = prestaties.filter((p) => p.eindklant_id === klantId);
    const byWerknemer = {};
    for (const p of klantPrestaties) {
      const key = p.werknemer_naam || p.werknemer_id || "Onbekend";
      if (!byWerknemer[key]) byWerknemer[key] = { naam: key, records: [], totaalUren: 0 };
      byWerknemer[key].records.push(p);
      byWerknemer[key].totaalUren += p.totaal_uren || p.uren || 0;
    }
    return {
      werknemers: Object.values(byWerknemer).sort((a, b) => b.totaalUren - a.totaalUren),
      totaalUren: klantPrestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0),
      aantalRecords: klantPrestaties.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-accent" />
          Klanten
        </h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoeken op naam..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loadingKlanten && <p className="text-muted-foreground text-sm">Laden...</p>}

      <div className="space-y-3">
        {filtered.map((k) => {
          const isOpen = expanded[k.id];
          const { werknemers, totaalUren, aantalRecords } = getKlantData(k.id);

          return (
            <Card key={k.id} className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => toggleExpand(k.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Building2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{k.naam}</p>
                    {k.contactpersoon && <p className="text-xs text-muted-foreground">{k.contactpersoon}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {werknemers.length} werknemers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {totaalUren.toFixed(1)}u totaal
                    </span>
                    <span className="text-xs">{aantalRecords} records</span>
                  </div>
                  <Badge variant="secondary" className={k.status === "actief" ? "bg-chart-5/10 text-chart-5" : "bg-muted text-muted-foreground"}>
                    {k.status}
                  </Badge>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t px-5 py-4 bg-muted/20">
                  {werknemers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Geen prestatie-records gevonden voor deze klant.</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Uren per werknemer</p>
                      <div className="space-y-2">
                        {werknemers.map((w) => (
                          <div key={w.naam} className="flex items-center justify-between bg-background rounded-lg px-4 py-2.5 border">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                {w.naam.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">{w.naam}</span>
                              <span className="text-xs text-muted-foreground">{w.records.length} records</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {w.totaalUren.toFixed(1)}u
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-2 border-t">
                        <span className="text-sm font-bold">Totaal: {totaalUren.toFixed(1)} uur</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && !loadingKlanten && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Geen klanten gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
}