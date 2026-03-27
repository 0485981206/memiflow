import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, FileText, AlertTriangle, Search, Pencil, Check, X, MapPin } from "lucide-react";
import KlokRegistratiesTab from "../../components/prestaties/KlokRegistratiesTab";

function EditableCell({ value, onSave, type = "text", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-accent/10 px-1 py-0.5 rounded ${className}`}
        onClick={() => { setVal(value); setEditing(true); }}
        title="Klik om te bewerken"
      >
        {value || "—"}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5">
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className={`border rounded px-1 py-0.5 text-xs ${type === "date" ? "w-28" : "w-16"}`}
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button onClick={save} className="text-green-600 hover:bg-green-50 rounded p-0.5"><Check className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-red-500 hover:bg-red-50 rounded p-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

export default function Records() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: prestaties = [], isLoading } = useQuery({
    queryKey: ["prestaties-records"],
    queryFn: () => base44.entities.Prestatie.list("-datum", 50),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prestatie.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestaties-records"] });
      queryClient.invalidateQueries({ queryKey: ["prestaties"] });
    },
  });

  const geimporteerd = useMemo(() => {
    let records = prestaties.filter(p => p.bron);
    if (search.trim()) {
      const q = search.toLowerCase();
      records = records.filter(p =>
        (p.werknemer_naam || "").toLowerCase().includes(q) ||
        (p.externe_id || "").toLowerCase().includes(q) ||
        (p.firma || "").toLowerCase().includes(q) ||
        (p.datum || "").includes(q) ||
        (p.bron || "").toLowerCase().includes(q)
      );
    }
    return records.sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));
  }, [prestaties, search]);

  const handleUpdateField = (id, field, value) => {
    const parsed = field === "uren" || field === "totaal_uren" ? (parseFloat(value) || 0) : value;
    updateMut.mutate({ id, data: { [field]: parsed } });
  };

  const handleUpdateDatum = async (prestatie, newDatum) => {
    if (!newDatum || newDatum === prestatie.datum) return;
    // Update de prestatie datum
    const dayNames = { 0: "Zo", 1: "Ma", 2: "Di", 3: "Wo", 4: "Do", 5: "Vr", 6: "Za" };
    const newDay = dayNames[new Date(newDatum).getDay()] || "";
    await base44.entities.Prestatie.update(prestatie.id, { datum: newDatum, dag: newDay });
    // Sync gekoppelde klokregistratie als bron is "klok" of "nfc"
    if ((prestatie.bron === "klok" || prestatie.bron === "nfc") && prestatie.id) {
      try {
        const klokRecords = await base44.entities.Klokregistratie.filter({ prestatie_id: prestatie.id });
        for (const kr of klokRecords) {
          await base44.entities.Klokregistratie.update(kr.id, { datum: newDatum });
        }
      } catch (e) {
        console.warn("Klokregistratie sync mislukt:", e);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["prestaties-records"] });
    queryClient.invalidateQueries({ queryKey: ["prestaties"] });
  };

  const handleUpdateCheckin = (id, prestatie, slotNum, type, value) => {
    const field = `${type}_${slotNum}`;
    updateMut.mutate({ id, data: { [field]: value } });
  };

  const [activeTab, setActiveTab] = useState("import");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" />
          Records
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/60 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("import")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "import" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Geïmporteerd
        </button>
        <button
          onClick={() => setActiveTab("klok")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "klok" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Klokregistraties
        </button>
      </div>

      {activeTab === "klok" ? (
        <KlokRegistratiesTab />
      ) : (
      <>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op werknemer, firma, datum..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{geimporteerd.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Records</p>
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
            Geen records gevonden
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 sticky top-0 z-10">
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
                  const slots = [1, 2, 3, 4, 5, 6].map(n => {
                    const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
                    return (inn || uit) ? { n, inn: inn || "", uit: uit || "" } : null;
                  }).filter(Boolean);

                  return (
                    <tr key={p.id || i} className="border-t hover:bg-muted/30">
                      <td className="p-2 font-medium">{p.werknemer_naam || "—"}</td>
                      <td className="p-2 font-mono text-muted-foreground">{p.externe_id || "—"}</td>
                      <td className="p-2">
                        <EditableCell
                          value={p.datum || ""}
                          type="date"
                          onSave={(v) => handleUpdateDatum(p, v)}
                        />
                      </td>
                      <td className="p-2 text-muted-foreground">{p.dag || "—"}</td>
                      <td className="p-2 text-muted-foreground">{p.firma || "—"}</td>
                      <td className="p-2 text-right font-medium">
                        <EditableCell
                          value={p.totaal_uren ?? p.uren ?? ""}
                          type="number"
                          onSave={(v) => handleUpdateField(p.id, "totaal_uren", v)}
                          className="font-medium"
                        />
                      </td>
                      <td className="p-2">
                        {slots.length > 0 ? (
                          <div className="space-y-0.5">
                            {slots.map(s => (
                              <div key={s.n} className="flex items-center gap-0.5 font-mono text-muted-foreground">
                                <EditableCell
                                  value={s.inn}
                                  onSave={(v) => handleUpdateCheckin(p.id, p, s.n, "in", v)}
                                />
                                <span>–</span>
                                <EditableCell
                                  value={s.uit}
                                  onSave={(v) => handleUpdateCheckin(p.id, p, s.n, "uit", v)}
                                />
                              </div>
                            ))}
                          </div>
                        ) : "—"}
                      </td>
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
      </>
      )}
    </div>
  );
}