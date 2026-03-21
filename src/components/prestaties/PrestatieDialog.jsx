import React, { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import WerknemerCombobox from "./WerknemerCombobox";

export default function PrestatieDialog({
  open, onClose, date, werknemers, codes, plaatsingen,
  existingPrestaties, onSave, onDelete, selectedWerknemer
}) {
  const [form, setForm] = useState({
    werknemer_id: selectedWerknemer || "",
    code: "",
    uren: "",
    opmerking: "",
  });

  React.useEffect(() => {
    setForm((f) => ({
      ...f,
      werknemer_id: selectedWerknemer || "",
      code: "",
      uren: "",
      opmerking: "",
    }));
  }, [date, selectedWerknemer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const w = werknemers.find((x) => x.id === form.werknemer_id);
    const p = plaatsingen.find(
      (x) => x.werknemer_id === form.werknemer_id && x.status === "actief"
    );
    const codeObj = codes.find((c) => c.code === form.code);

    onSave({
      werknemer_id: form.werknemer_id,
      werknemer_naam: w ? `${w.voornaam} ${w.achternaam}` : "",
      eindklant_id: p?.eindklant_id || "",
      eindklant_naam: p?.eindklant_naam || "",
      plaatsing_id: p?.id || "",
      datum: format(date, "yyyy-MM-dd"),
      code: form.code,
      uren: Number(form.uren) || (codeObj?.standaard_uren || 8),
      opmerking: form.opmerking,
      status: "ingevoerd",
      maand: format(date, "yyyy-MM"),
    });

    setForm({ ...form, code: "", uren: "", opmerking: "" });
  };

  const getCodeColor = (code) => {
    const found = codes.find((c) => c.code === code);
    return found?.kleur || "#3b82f6";
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Prestaties — {format(date, "EEEE d MMMM yyyy", { locale: nl })}
          </DialogTitle>
        </DialogHeader>

        {/* Existing prestaties for this day */}
        {existingPrestaties.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-muted-foreground">Bestaande prestaties</p>
            {existingPrestaties.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-white text-xs"
                    style={{ backgroundColor: getCodeColor(p.code) }}
                  >
                    {p.code}
                  </Badge>
                  <span className="text-sm font-medium">{p.werknemer_naam}</span>
                  <span className="text-sm text-muted-foreground">{p.uren}u</span>
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
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Werknemer</Label>
            <select
              value={form.werknemer_id}
              onChange={(e) => setForm({ ...form, werknemer_id: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Kies werknemer</option>
              {werknemers
                .filter((w) => !w.status || w.status === "actief")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.voornaam} {w.achternaam}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <select
                value={form.code}
                onChange={(e) => {
                  const v = e.target.value;
                  const codeObj = codes.find((c) => c.code === v);
                  setForm({
                    ...form,
                    code: v,
                    uren: codeObj?.standaard_uren ? String(codeObj.standaard_uren) : form.uren,
                  });
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Kies code</option>
                {codes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.naam}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={!form.werknemer_id || !form.code}
            >
              Toevoegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}