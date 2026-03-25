import React, { useState, useEffect } from "react";
import { format, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import { X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import WerknemerCombobox from "./WerknemerCombobox.jsx";
import AcertaCodesTab from "./AcertaCodesTab";
import PrestatieCard from "./PrestatieCard";
import PrestatieCodeLines from "./PrestatieCodeLines";
import { berekenPrestatieCodes, buildCodeMap } from "@/lib/prestatie-codes";

export default function PrestatieDialog({
  open, onClose, date, werknemers, codes, plaatsingen,
  existingPrestaties, onSave, onDelete, onUpdate, selectedWerknemer
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

  const codeMap = React.useMemo(() => buildCodeMap(codes), [codes]);

  const computeLines = () => {
    if (!date || !selectedWerknemer) return [];
    const totalUren = existingPrestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
    const hasData = existingPrestaties.length > 0;
    return berekenPrestatieCodes(
      format(date, "yyyy-MM-dd"),
      getDay(date),
      hasData ? totalUren : null,
      codeMap
    );
  };

  // Bereken acerta codes wanneer date of prestaties wijzigen
  useEffect(() => {
    setAcertaLines(computeLines());
  }, [date, existingPrestaties, selectedWerknemer, codes]);

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
                  {existingPrestaties.map((p) => (
                    <PrestatieCard key={p.id} p={p} onDelete={onDelete} onUpdate={onUpdate} />
                  ))}
                </div>
              )}
              {/* Berekende codes in Prestaties tab */}
              {acertaLines.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/20 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Berekende codes</p>
                  {acertaLines.map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {l.isSecondary && <span className="text-muted-foreground font-bold">↓</span>}
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.kleur }} />
                        <span className="font-medium">{l.code}</span>
                        <span className="text-muted-foreground text-xs">{l.naam}</span>
                      </div>
                      <span className="font-semibold">{l.uren.toFixed(2).replace('.', ',')}u</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <AcertaCodesTab
              lines={acertaLines}
              onChange={setAcertaLines}
              dbCodes={codes}
              onReset={() => setAcertaLines(computeLines())}
            />
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