import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Search, AlertTriangle, Check, X, MapPin, Pencil, Trash2 } from "lucide-react";

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
        className={`border rounded px-1 py-0.5 text-xs ${type === "date" ? "w-28" : type === "time" ? "w-20" : "w-16"}`}
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button onClick={save} className="text-green-600 hover:bg-green-50 rounded p-0.5"><Check className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-red-500 hover:bg-red-50 rounded p-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

export default function KlokRegistratiesTab() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: registraties = [], isLoading } = useQuery({
    queryKey: ["klokregistraties-admin"],
    queryFn: () => base44.entities.Klokregistratie.list("-datum", 100),
  });

  const { data: werkspots = [] } = useQuery({
    queryKey: ["werkspots-admin"],
    queryFn: () => base44.entities.Werkspot.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Klokregistratie.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["klokregistraties-admin"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Klokregistratie.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["klokregistraties-admin"] }),
  });

  // Build werkspot lookup by werknemer
  const werknemerWerkspotMap = useMemo(() => {
    const map = {};
    for (const ws of werkspots) {
      for (const wid of (ws.toegewezen_werknemers || [])) {
        if (!map[wid]) map[wid] = [];
        map[wid].push(ws.naam);
      }
    }
    return map;
  }, [werkspots]);

  const filtered = useMemo(() => {
    let records = registraties;
    if (search.trim()) {
      const q = search.toLowerCase();
      records = records.filter(r =>
        (r.werknemer_naam || "").toLowerCase().includes(q) ||
        (r.eindklant_naam || "").toLowerCase().includes(q) ||
        (r.datum || "").includes(q)
      );
    }
    return records.sort((a, b) => (b.datum || "").localeCompare(a.datum || "") || (b.start_tijd || "").localeCompare(a.start_tijd || ""));
  }, [registraties, search]);

  const gestopt = filtered.filter(r => r.status === "gestopt");
  const actief = filtered.filter(r => r.status === "gestart");
  const totaalUren = gestopt.reduce((s, r) => {
    if (!r.start_tijd || !r.stop_tijd) return s;
    const [sh, sm] = r.start_tijd.split(":").map(Number);
    const [eh, em] = r.stop_tijd.split(":").map(Number);
    return s + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);

  const handleUpdate = (id, field, value) => {
    updateMut.mutate({ id, data: { [field]: value } });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op werknemer, klant, datum..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Totaal</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{actief.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Actief</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{gestopt.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Gestopt</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{Math.round(totaalUren * 100) / 100}</p>
          <p className="text-xs text-muted-foreground mt-1">Totaal uren</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
            Geen klokregistraties gevonden
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-2 font-semibold">Werknemer</th>
                  <th className="text-left p-2 font-semibold">Eindklant</th>
                  <th className="text-left p-2 font-semibold">Werkspot</th>
                  <th className="text-left p-2 font-semibold">Datum</th>
                  <th className="text-left p-2 font-semibold">Start</th>
                  <th className="text-left p-2 font-semibold">Stop</th>
                  <th className="text-right p-2 font-semibold">Uren</th>
                  <th className="text-left p-2 font-semibold">Status</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const wsNames = werknemerWerkspotMap[r.werknemer_id] || [];
                  let uren = "—";
                  if (r.start_tijd && r.stop_tijd) {
                    const [sh, sm] = r.start_tijd.split(":").map(Number);
                    const [eh, em] = r.stop_tijd.split(":").map(Number);
                    uren = (Math.round(Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60) * 100) / 100).toFixed(2);
                  }

                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-2 font-medium">{r.werknemer_naam || "—"}</td>
                      <td className="p-2 text-muted-foreground">{r.eindklant_naam || "—"}</td>
                      <td className="p-2">
                        {wsNames.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5" />{wsNames.join(", ")}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-2">
                        <EditableCell
                          value={r.datum || ""}
                          type="date"
                          onSave={(v) => handleUpdate(r.id, "datum", v)}
                        />
                      </td>
                      <td className="p-2">
                        <EditableCell
                          value={r.start_tijd || ""}
                          type="time"
                          onSave={(v) => handleUpdate(r.id, "start_tijd", v)}
                        />
                      </td>
                      <td className="p-2">
                        {r.stop_tijd ? (
                          <EditableCell
                            value={r.stop_tijd}
                            type="time"
                            onSave={(v) => handleUpdate(r.id, "stop_tijd", v)}
                          />
                        ) : (
                          <span className="text-green-600 font-medium text-[10px]">lopend</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-medium">{uren}</td>
                      <td className="p-2">
                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          r.status === "gestart" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          {r.status === "gestart" ? "Actief" : "Gestopt"}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => deleteMut.mutate(r.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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