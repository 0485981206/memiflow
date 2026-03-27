import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, ArrowRight, Loader2, UserX, UserCheck, Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function EmployeeDetailSheet({ werknemer, klant, isOpen, onClose, onStatusChange, onWerknemerUpdated }) {
  const [werkspots, setWerkspots] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editAlias, setEditAlias] = useState("");
  const [editVoornaam, setEditVoornaam] = useState("");
  const [editAchternaam, setEditAchternaam] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!isOpen || !werknemer) return;
    setEditingName(false);
    setEditAlias(werknemer.alias || "");
    setEditVoornaam(werknemer.voornaam || "");
    setEditAchternaam(werknemer.achternaam || "");
  }, [isOpen, werknemer]);

  useEffect(() => {
    if (!isOpen || !werknemer) return;
    
    const load = async () => {
      setLoading(true);
      try {
        // Fetch werkspots where this werknemer is assigned
        const wsRes = await base44.functions.invoke("locationWerkspots", {
          action: "list",
          eindklant_id: klant.id,
        });
        const allWerkspots = wsRes.data.werkspots || [];
        const assigned = allWerkspots.filter(ws => 
          (ws.toegewezen_werknemers || []).includes(werknemer.id)
        );
        setWerkspots(assigned);

        // Fetch recent klokregistraties
        const recRes = await base44.functions.invoke("locationRecords", {
          eindklant_id: klant.id,
        });
        const allRecords = recRes.data.records || [];
        const werknemerRecords = allRecords.filter(r => r.werknemer_id === werknemer.id);
        setRecords(werknemerRecords);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [isOpen, werknemer, klant.id]);

  const handleToggleStatus = async () => {
    if (!werknemer) return;
    setSaving(true);
    const newStatus = werknemer.location_status === "inactief" ? "actief" : "inactief";
    await base44.functions.invoke("updateWerknemerLocationStatus", {
      werknemer_id: werknemer.id,
      location_status: newStatus,
    });
    setSaving(false);
    onStatusChange?.(werknemer.id, newStatus);
    onClose();
  };

  if (!werknemer) return null;

  const isInactief = werknemer.location_status === "inactief";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${isInactief ? "bg-gray-400" : "bg-blue-500"}`}>
              {(werknemer.naam || "?").charAt(0)}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{werknemer.alias || werknemer.naam}</SheetTitle>
              {werknemer.alias && <p className="text-xs text-muted-foreground">{werknemer.naam}</p>}
              {werknemer.functie && <p className="text-sm text-muted-foreground">{werknemer.functie}</p>}
              <Badge variant={isInactief ? "secondary" : "default"} className={`mt-1 ${isInactief ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"}`}>
                {isInactief ? "Niet actief" : "Actief"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* Naam & alias bewerken */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Naam & alias
                </h3>
                {!editingName && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditingName(true)}>
                    <Pencil className="w-3 h-3" /> Bewerken
                  </Button>
                )}
              </div>
              {editingName ? (
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Voornaam</Label>
                      <Input value={editVoornaam} onChange={(e) => setEditVoornaam(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Achternaam</Label>
                      <Input value={editAchternaam} onChange={(e) => setEditAchternaam(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Alias / bijnaam</Label>
                    <Input value={editAlias} onChange={(e) => setEditAlias(e.target.value)} placeholder="Optioneel - wordt getoond i.p.v. echte naam" className="h-8 text-sm" />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setEditingName(false)}>
                      <X className="w-3 h-3" /> Annuleren
                    </Button>
                    <Button size="sm" className="h-7 gap-1" disabled={savingName || !editVoornaam.trim() || !editAchternaam.trim()} onClick={async () => {
                      setSavingName(true);
                      await base44.entities.Werknemer.update(werknemer.id, {
                        voornaam: editVoornaam.trim(),
                        achternaam: editAchternaam.trim(),
                        alias: editAlias.trim() || null,
                      });
                      setSavingName(false);
                      setEditingName(false);
                      onWerknemerUpdated?.(werknemer.id, {
                        voornaam: editVoornaam.trim(),
                        achternaam: editAchternaam.trim(),
                        alias: editAlias.trim() || null,
                        naam: `${editVoornaam.trim()} ${editAchternaam.trim()}`,
                      });
                    }}>
                      {savingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Opslaan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm space-y-1">
                  <p><span className="text-gray-500">Naam:</span> {werknemer.naam}</p>
                  {werknemer.alias && <p><span className="text-gray-500">Alias:</span> {werknemer.alias}</p>}
                </div>
              )}
            </div>

            {/* Toegewezen werkplaatsen */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Toegewezen werkplaatsen
              </h3>
              {werkspots.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Geen werkplaatsen toegewezen</p>
              ) : (
                <div className="space-y-1">
                  {werkspots.map(ws => (
                    <div key={ws.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      {ws.naam}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registraties vandaag */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Registraties vandaag
              </h3>
              {records.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Geen registraties vandaag</p>
              ) : (
                <div className="space-y-2">
                  {records.map(r => (
                    <div key={r.id} className={`rounded-lg px-3 py-2 text-sm flex items-center justify-between ${r.status === "gestart" ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{r.start_tijd}</span>
                        {r.stop_tijd && (
                          <>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="font-mono">{r.stop_tijd}</span>
                          </>
                        )}
                      </div>
                      {r.status === "gestart" && (
                        <span className="text-xs text-green-600 font-medium">Actief</span>
                      )}
                      {r.status === "gestopt" && r.start_tijd && r.stop_tijd && (
                        <span className="text-xs text-gray-500">{formatDuration(r.start_tijd, r.stop_tijd)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status wijzigen */}
            <div className="pt-4 border-t">
              <Button
                variant={isInactief ? "default" : "outline"}
                className={`w-full gap-2 ${!isInactief ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" : ""}`}
                onClick={handleToggleStatus}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isInactief ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                {isInactief ? "Activeren" : "Op niet actief zetten"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function formatDuration(start, stop) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = stop.split(":").map(Number);
  const mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}u${String(m).padStart(2, "0")}m`;
}