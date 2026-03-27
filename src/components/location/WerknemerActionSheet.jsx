import React, { useState } from "react";
import { AlertTriangle, ArrowRightLeft, Loader2, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SPOT_ICONS = {
  "Billen": "🍗",
  "Inpakken": "📦",
  "File": "🍖",
  "Filé": "🍖",
  "Hele kip": "🐔",
};

const REDENEN = [
  "Ziek",
  "Ongeval",
  "Is naar huis",
  "Toegestane afwezigheid",
  "Ongeoorloofd afwezig",
  "Vervoersproblemen",
  "Persoonlijke redenen",
  "Andere reden",
];

export default function WerknemerActionSheet({
  isOpen,
  onClose,
  werknemer,
  klant,
  werkspot,
  werkspots = [],
  onDone,
}) {
  const [mode, setMode] = useState(null); // null = choose action, 'afwijking' | 'verplaats'
  const [reden, setReden] = useState("");
  const [customReden, setCustomReden] = useState("");
  const [targetWerkspot, setTargetWerkspot] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setMode(null);
    setReden("");
    setCustomReden("");
    setTargetWerkspot(null);
    onClose();
  };

  const handleAfwijking = async () => {
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
    toast.success("Afwijking geregistreerd");
    handleClose();
    onDone?.();
  };

  const handleVerplaats = async () => {
    if (!targetWerkspot) return;
    setSaving(true);
    await base44.functions.invoke("afwijkingRegistratie", {
      action: "transfer",
      werknemer_id: werknemer?.id,
      werknemer_naam: werknemer?.naam,
      eindklant_id: klant?.id,
      eindklant_naam: klant?.naam,
      van_werkspot_id: werkspot?.id,
      van_werkspot_naam: werkspot?.naam,
      naar_werkspot_id: targetWerkspot.id,
      naar_werkspot_naam: targetWerkspot.naam,
    });
    setSaving(false);
    toast.success(`${werknemer?.naam} verplaatst naar ${targetWerkspot.naam}`);
    handleClose();
    onDone?.();
  };

  const getSpotIcon = (name) => {
    if (!name) return "📍";
    for (const [key, icon] of Object.entries(SPOT_ICONS)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return "📍";
  };

  if (!werknemer) return null;

  const otherWerkspots = werkspots.filter(ws => ws.id !== werkspot?.id);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {(werknemer.naam || "?").charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-base">{werknemer.naam}</SheetTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {getSpotIcon(werkspot?.naam)} {werkspot?.naam || "Geen werkspot"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-3">
          {!mode && (
            <>
              <p className="text-sm text-gray-600">Wat wil je doen?</p>
              <button
                onClick={() => setMode("afwijking")}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm text-amber-800">Afwijking melden</p>
                  <p className="text-xs text-amber-600">Ziek, ongeval, naar huis, etc.</p>
                </div>
              </button>
              {otherWerkspots.length > 0 && (
                <button
                  onClick={() => setMode("verplaats")}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-blue-800">Verplaatsen naar andere werkpost</p>
                    <p className="text-xs text-blue-600">Werknemer van werkpost wisselen</p>
                  </div>
                </button>
              )}
            </>
          )}

          {mode === "afwijking" && (
            <>
              <p className="text-sm text-gray-600 font-medium">Selecteer de reden:</p>
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
                <Button variant="outline" className="flex-1" onClick={() => setMode(null)}>Terug</Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                  onClick={handleAfwijking}
                  disabled={saving || !reden || (reden === "Andere reden" && !customReden.trim())}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Bevestigen
                </Button>
              </div>
            </>
          )}

          {mode === "verplaats" && (
            <>
              <p className="text-sm text-gray-600 font-medium">Kies nieuwe werkpost:</p>
              <div className="space-y-2">
                {otherWerkspots.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setTargetWerkspot(ws)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${
                      targetWerkspot?.id === ws.id
                        ? "border-blue-400 bg-blue-50 text-blue-800 font-medium"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{getSpotIcon(ws.naam)}</span>
                    <span>{ws.naam}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setMode(null); setTargetWerkspot(null); }}>Terug</Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleVerplaats}
                  disabled={saving || !targetWerkspot}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                  Verplaatsen
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}