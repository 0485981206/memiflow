import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Loader2 } from "lucide-react";

const PAUZE_REDENEN = [
  "Lunchpauze",
  "Korte pauze",
  "Vergadering",
  "Materiaal ophalen",
  "Wachttijd",
];

export default function PauzeSheet({ isOpen, onClose, werkspot, onConfirm }) {
  const [reden, setReden] = useState("");
  const [customReden, setCustomReden] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const finalReden = reden === "anders" ? customReden.trim() : reden;
    if (!finalReden) return;
    setSaving(true);
    await onConfirm(werkspot, finalReden);
    setSaving(false);
    setReden("");
    setCustomReden("");
  };

  const handleClose = () => {
    setReden("");
    setCustomReden("");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5 text-amber-500" />
            Pauze — {werkspot?.naam}
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">Selecteer een reden voor de pauze:</p>

          <div className="space-y-2">
            {PAUZE_REDENEN.map((r) => (
              <button
                key={r}
                onClick={() => setReden(r)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-100 active:scale-[0.98] select-none touch-manipulation ${
                  reden === r ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setReden("anders")}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-100 active:scale-[0.98] select-none touch-manipulation ${
                reden === "anders" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              Andere reden...
            </button>
          </div>

          {reden === "anders" && (
            <Input
              value={customReden}
              onChange={(e) => setCustomReden(e.target.value)}
              placeholder="Typ de reden..."
              autoFocus
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Annuleren</Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 gap-1"
              onClick={handleConfirm}
              disabled={saving || (!reden || (reden === "anders" && !customReden.trim()))}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pauzeren
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}