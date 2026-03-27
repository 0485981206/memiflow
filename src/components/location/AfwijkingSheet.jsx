import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const REDENEN = [
  "Ziek gemeld",
  "Ongeoorloofd afwezig",
  "Vervoersproblemen",
  "Persoonlijke redenen",
  "Materiaal niet beschikbaar",
  "Weer omstandigheden",
  "Andere reden",
];

export default function AfwijkingSheet({ isOpen, onClose, werknemer, klant, werkspot, onAfwijkingDone }) {
  const [reden, setReden] = useState("");
  const [customReden, setCustomReden] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const finalReden = reden === "Andere reden" ? customReden.trim() : reden;
    if (!finalReden) return;
    setSaving(true);
    await base44.functions.invoke("afwijkingRegistratie", {
      action: "create",
      werknemer_id: werknemer?.id,
      werknemer_naam: werknemer?.naam,
      eindklant_id: klant?.id,
      eindklant_naam: klant?.naam,
      werkspot_id: werkspot?.id,
      werkspot_naam: werkspot?.naam,
      reden: finalReden,
    });
    setSaving(false);
    setReden("");
    setCustomReden("");
    onAfwijkingDone?.();
    onClose();
  };

  const handleClose = () => {
    setReden("");
    setCustomReden("");
    onClose();
  };

  if (!werknemer) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <SheetTitle className="text-base">Afwijking melden</SheetTitle>
              <p className="text-sm text-muted-foreground">{werknemer.naam}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-gray-600">Selecteer de reden voor de afwijking. De timer wordt gestopt.</p>

          <div className="space-y-2">
            {REDENEN.map((r) => (
              <button
                key={r}
                onClick={() => setReden(r)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  reden === r
                    ? "border-amber-400 bg-amber-50 text-amber-800 font-medium"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {reden === "Andere reden" && (
            <textarea
              value={customReden}
              onChange={(e) => setCustomReden(e.target.value)}
              placeholder="Beschrijf de reden..."
              className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Annuleren
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              onClick={handleSave}
              disabled={saving || !reden || (reden === "Andere reden" && !customReden.trim())}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Bevestigen
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}