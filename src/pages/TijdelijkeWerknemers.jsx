import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Link2, Clock, ArrowRight, Search, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TijdelijkeWerknemers() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [koppelDialog, setKoppelDialog] = useState(null);

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.filter({ status: "actief" }),
  });

  const loadRecords = async () => {
    const res = await base44.functions.invoke("tijdelijkeWerknemer", { action: "list_all" });
    setRecords(res.data.records || []);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, []);

  const filtered = records.filter((r) => {
    const naam = `${r.voornaam} ${r.achternaam}`.toLowerCase();
    const q = search.toLowerCase();
    if (q && !naam.includes(q) && !(r.eindklant_naam || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "alle" && r.status !== statusFilter) return false;
    return true;
  });

  const handleKoppel = async (werknemerId, werknemerNaam) => {
    await base44.functions.invoke("tijdelijkeWerknemer", {
      action: "koppel",
      id: koppelDialog.id,
      werknemer_id: werknemerId,
      werknemer_naam: werknemerNaam,
    });
    setKoppelDialog(null);
    await loadRecords();
  };

  const statusBadge = (status) => {
    switch (status) {
      case "ingecheckt": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ingecheckt</Badge>;
      case "uitgecheckt": return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Uitgecheckt</Badge>;
      case "gekoppeld": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Gekoppeld</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" />
          Tijdelijke Werknemers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Werknemers die door teamleaders zijn ingecheckt zonder account
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam of klant..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="ingecheckt">Ingecheckt</SelectItem>
            <SelectItem value="uitgecheckt">Uitgecheckt</SelectItem>
            <SelectItem value="gekoppeld">Gekoppeld</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Geen tijdelijke werknemers gevonden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const naam = `${r.voornaam} ${r.achternaam}`;
            return (
              <div key={r.id} className="bg-card rounded-lg border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    r.status === "ingecheckt" ? "bg-green-500" : r.status === "gekoppeld" ? "bg-blue-500" : "bg-gray-300"
                  }`}>
                    {naam.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{naam}</p>
                      {statusBadge(r.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{r.eindklant_naam}</span>
                      <span>•</span>
                      <span>{r.datum}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{r.start_tijd}</span>
                      {r.stop_tijd && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <span>{r.stop_tijd}</span>
                        </>
                      )}
                      {r.telefoon && <span>• 📞 {r.telefoon}</span>}
                    </div>
                    {r.opmerking && <p className="text-xs text-muted-foreground mt-0.5">{r.opmerking}</p>}
                    {r.status === "gekoppeld" && (
                      <p className="text-xs text-blue-600 mt-0.5">→ {r.gekoppeld_werknemer_naam}</p>
                    )}
                  </div>
                </div>
                {r.status !== "gekoppeld" && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setKoppelDialog(r)}>
                    <Link2 className="w-3.5 h-3.5" /> Koppelen
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {koppelDialog && (
        <KoppelDialog
          record={koppelDialog}
          werknemers={werknemers}
          onKoppel={handleKoppel}
          onClose={() => setKoppelDialog(null)}
        />
      )}
    </div>
  );
}

function KoppelDialog({ record, werknemers, onKoppel, onClose }) {
  const [search, setSearch] = useState("");
  const naam = `${record.voornaam} ${record.achternaam}`;

  const filtered = werknemers.filter((w) => {
    const wNaam = `${w.voornaam} ${w.achternaam}`.toLowerCase();
    return !search || wNaam.includes(search.toLowerCase());
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Koppel "{naam}" aan werknemer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek werknemer..."
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map((w) => (
              <button
                key={w.id}
                onClick={() => onKoppel(w.id, `${w.voornaam} ${w.achternaam}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {w.voornaam?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{w.voornaam} {w.achternaam}</p>
                  {w.functie && <p className="text-xs text-muted-foreground">{w.functie}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Geen werknemers gevonden</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}