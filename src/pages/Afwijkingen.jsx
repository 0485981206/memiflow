import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Afwijkingen() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [klantFilter, setKlantFilter] = useState("alle");
  const queryClient = useQueryClient();

  const { data: afwijkingen = [], isLoading } = useQuery({
    queryKey: ["afwijkingen"],
    queryFn: () => base44.entities.Afwijking.list("-created_date", 200),
  });

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.filter({ status: "actief" }),
  });

  const handleMarkBehandeld = async (id) => {
    await base44.entities.Afwijking.update(id, { status: "behandeld" });
    queryClient.invalidateQueries(["afwijkingen"]);
  };

  const filtered = afwijkingen.filter((a) => {
    if (statusFilter !== "alle" && a.status !== statusFilter) return false;
    if (klantFilter !== "alle" && a.eindklant_id !== klantFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(a.werknemer_naam || "").toLowerCase().includes(q) &&
        !(a.eindklant_naam || "").toLowerCase().includes(q) &&
        !(a.reden || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const openCount = afwijkingen.filter((a) => a.status === "open").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Afwijkingen
          </h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open afwijking{openCount !== 1 ? "en" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, klant of reden..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="behandeld">Behandeld</SelectItem>
          </SelectContent>
        </Select>
        <Select value={klantFilter} onValueChange={setKlantFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle klanten</SelectItem>
            {klanten.map((k) => (
              <SelectItem key={k.id} value={k.id}>{k.naam}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Geen afwijkingen gevonden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className={`bg-card rounded-lg border p-4 flex items-center justify-between ${a.status === "open" ? "border-amber-200" : "border-border"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${a.status === "open" ? "bg-amber-500" : "bg-gray-300"}`}>
                  {(a.werknemer_naam || "?").charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{a.werknemer_naam}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.eindklant_naam}{a.werkspot_naam ? ` — ${a.werkspot_naam}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.datum ? format(new Date(a.datum), "d MMM yyyy", { locale: nl }) : ""} {a.stop_tijd ? `om ${a.stop_tijd}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${a.reden?.startsWith('Verplaatst') ? 'text-blue-700' : 'text-amber-700'}`}>{a.reden}</p>
                  <Badge variant={a.status === "open" ? "default" : "secondary"} className={a.status === "open" ? "bg-amber-100 text-amber-700" : a.reden?.startsWith('Verplaatst') ? "bg-blue-100 text-blue-700" : ""}>
                    {a.reden?.startsWith('Verplaatst') ? 'verplaatsing' : a.status}
                  </Badge>
                </div>
                {a.status === "open" && (
                  <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleMarkBehandeld(a.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Behandeld
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}