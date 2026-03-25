import React, { useState, useEffect } from "react";
import { format, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import WerknemerCombobox from "./WerknemerCombobox.jsx";
import AcertaCodesTab from "./AcertaCodesTab";
import { berekenPrestatieCodes } from "@/lib/prestatie-codes";

export default function PrestatieDialog({
  open, onClose, date, werknemers, codes, plaatsingen,
  existingPrestaties, onSave, onDelete, selectedWerknemer
}) {
  const [form, setForm] = useState({
    werknemer_id: selectedWerknemer || "",
    uren: "",
    opmerking: "",
  });
  const [activeTab, setActiveTab] = useState("prestaties");
  const [acertaLines, setAcertaLines] = useState([]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      werknemer_id: selectedWerknemer || "",
      uren: "",
      opmerking: "",
    }));
    setActiveTab("prestaties");
  }, [date, selectedWerknemer]);

  // Bereken acerta codes wanneer date of prestaties wijzigen
  useEffect(() => {
    if (!date || !selectedWerknemer) { setAcertaLines([]); return; }
    const totalUren = existingPrestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
    const hasData = existingPrestaties.length > 0;
    const lines = berekenPrestatieCodes(
      format(date, "yyyy-MM-dd"),
      getDay(date),
      hasData ? totalUren : null
    );
    setAcertaLines(lines);
  }, [date, existingPrestaties, selectedWerknemer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const w = werknemers.find((x) => x.id === form.werknemer_id);
    const p = plaatsingen.find(
      (x) => x.werknemer_id === form.werknemer_id && x.status === "actief"
    );

    onSave({
      werknemer_id: form.werknemer_id,
      werknemer_naam: w ? `${w.voornaam} ${w.achternaam}` : "",
      eindklant_id: p?.eindklant_id || "",
      eindklant_naam: p?.eindklant_naam || "",
      plaatsing_id: p?.id || "",
      datum: format(date, "yyyy-MM-dd"),
      uren: Number(form.uren) || 8,
      opmerking: form.opmerking,
      maand: format(date, "yyyy-MM"),
    });

    setForm({ ...form, uren: "", opmerking: "" });
  };

  if (!date) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose}>
      <div className={`w-full max-w-lg bg-background border-l shadow-xl flex flex-col transform transition-transform ${open ? "translate-x-0" : "translate-x-full"}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-5 py-4 space-y-3 z-10">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              Prestaties — {format(date, "EEEE d MMMM yyyy", { locale: nl })}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex rounded-lg border overflow-hidden">
            {["prestaties", "acerta"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                {tab === "prestaties" ? "Prestaties" : "Acerta"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {activeTab === "prestaties" ? (
            <>
              {/* Existing prestaties for this day */}
              {existingPrestaties.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Bestaande prestaties</p>
                  {existingPrestaties.map((p) => {
                    const tijden = [1,2,3,4,5,6].map(n => {
                      const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
                      return inn ? `${inn}–${uit || "?"}` : null;
                    }).filter(Boolean);
                    
                    return (
                      <div
                        key={p.id}
                        className="border rounded-lg p-3 space-y-2 bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{p.werknemer_naam}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{p.eindklant_naam || p.firma || "—"}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded">{p.totaal_uren ?? p.uren ?? 0}u</div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => onDelete(p.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {tijden.length > 0 && (
                          <div className="text-[11px] text-muted-foreground space-y-0.5 bg-muted/50 rounded px-2 py-1.5">
                            {tijden.map((t, i) => (
                              <div key={i}>{t}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <AcertaCodesTab lines={acertaLines} onChange={setAcertaLines} />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-5 py-4">
          {activeTab === "prestaties" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!selectedWerknemer && (
                <div>
                  <Label>Werknemer</Label>
                  <WerknemerCombobox
                    werknemers={werknemers.filter((w) => !w.status || w.status === "actief")}
                    value={form.werknemer_id}
                    onChange={(id) => setForm({ ...form, werknemer_id: id })}
                  />
                </div>
              )}

              <div>
                <Label>Uren</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={form.uren}
                  onChange={(e) => setForm({ ...form, uren: e.target.value })}
                  placeholder="8"
                />
              </div>

              <div>
                <Label>Opmerking</Label>
                <Input
                  value={form.opmerking}
                  onChange={(e) => setForm({ ...form, opmerking: e.target.value })}
                  placeholder="Optioneel..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Sluiten
                </Button>
                <Button
                  type="submit"
                  disabled={!form.werknemer_id || !form.uren}
                >
                  Toevoegen
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Sluiten</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}