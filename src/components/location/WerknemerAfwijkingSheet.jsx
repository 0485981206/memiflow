import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const AFWIJKING_REDENEN = [
  { code: "ziek", label: "Ziek" },
  { code: "ongeval", label: "Ongeval" },
  { code: "naar_huis", label: "Is naar huis" },
  { code: "toegestane_afwezigheid", label: "Toegestane afwezigheid" },
  { code: "andere", label: "Andere reden" },
];

export default function WerknemerAfwijkingSheet({ isOpen, onClose, werknemer, klant }) {
  const [reden, setReden] = useState("");
  const [customReden, setCustomReden] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const selectedReden = AFWIJKING_REDENEN.find(r => r.code === reden);
    const finalReden = reden === "andere" ? customReden.trim() : selectedReden?.label || reden;
    if (!finalReden) return;

    setSaving(true);
    await base44.entities.Afwijking.create({
      werknemer_id: werknemer?.id,
      werknemer_naam: werknemer?.naam,
      eindklant_id: klant?.id,
      eindklant_naam: klant?.naam,
      datum: new Date().toISOString().split("T")[0],
      reden: finalReden,
      status: "open",
    });

    // Stop any active registration
    const regs = await base44.entities.Klokregistratie.filter({ werknemer_id: werknemer?.id, status: "gestart" });
    for (const reg of regs) {
      const now = new Date();
      await base44.entities.Klokregistratie.update(reg.id, {
        status: "gestopt",
        stop_tijd: now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", hour12: false }),
      });
    }

    setSaving(false);
    setReden("");
    setCustomReden("");
    toast.success("Afwijking geregistreerd");
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
          <p className="text-sm text-gray-600">Selecteer de reden voor de afwijking:</p>

          <div className="space-y-2">
            {AFWIJKING_REDENEN.map((r) => (
              <button
                key={r.code}
                onClick={() => setReden(r.code)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  reden === r.code
                    ? "border-amber-400 bg-amber-50 text-amber-800 font-medium"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {reden === "andere" && (
            <Input
              value={customReden}
              onChange={(e) => setCustomReden(e.target.value)}
              placeholder="Beschrijf de reden..."
              className="mt-2"
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Annuleren</Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              onClick={handleSave}
              disabled={saving || !reden || (reden === "andere" && !customReden.trim())}
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