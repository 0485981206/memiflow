import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Loader2, Phone, MessageSquare, Square } from "lucide-react";

export default function TijdelijkDetailSheet({ tijdelijk, klant, isOpen, onClose, onStopTijdelijk }) {
  const [werkspots, setWerkspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!isOpen || !tijdelijk) return;

    const load = async () => {
      setLoading(true);
      const wsRes = await base44.functions.invoke("locationWerkspots", {
        action: "list",
        eindklant_id: klant.id,
      });
      const allWerkspots = wsRes.data.werkspots || [];
      const assigned = allWerkspots.filter(ws =>
        (ws.toegewezen_werknemers || []).includes(tijdelijk.id)
      );
      setWerkspots(assigned);
      setLoading(false);
    };
    load();
  }, [isOpen, tijdelijk, klant.id]);

  const handleStop = async () => {
    setStopping(true);
    await onStopTijdelijk?.(tijdelijk.id);
    setStopping(false);
    onClose();
  };

  if (!tijdelijk) return null;

  const statusConfig = {
    nieuw: { label: "Nieuw", className: "bg-orange-100 text-orange-700" },
    ingecheckt: { label: "Ingecheckt", className: "bg-green-100 text-green-700" },
    uitgecheckt: { label: "Uitgecheckt", className: "bg-gray-200 text-gray-600" },
    gekoppeld: { label: "Gekoppeld", className: "bg-blue-100 text-blue-700" },
  };
  const status = statusConfig[tijdelijk.status] || statusConfig.nieuw;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl bg-orange-500">
              {(tijdelijk.voornaam || "?").charAt(0)}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{tijdelijk.voornaam} {tijdelijk.achternaam}</SheetTitle>
              <p className="text-sm text-muted-foreground">Tijdelijke werknemer</p>
              <Badge variant="secondary" className={`mt-1 ${status.className}`}>
                {status.label}
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
            {/* Contact info */}
            {(tijdelijk.telefoon || tijdelijk.opmerking) && (
              <div className="space-y-2">
                {tijdelijk.telefoon && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{tijdelijk.telefoon}</span>
                  </div>
                )}
                {tijdelijk.opmerking && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{tijdelijk.opmerking}</span>
                  </div>
                )}
              </div>
            )}

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

            {/* Tijden */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Tijdsregistratie
              </h3>
              {tijdelijk.start_tijd ? (
                <div className={`rounded-lg px-3 py-2 text-sm flex items-center justify-between ${tijdelijk.status === "ingecheckt" ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{tijdelijk.start_tijd}</span>
                    {tijdelijk.stop_tijd && (
                      <>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-mono">{tijdelijk.stop_tijd}</span>
                      </>
                    )}
                  </div>
                  {tijdelijk.status === "ingecheckt" && (
                    <span className="text-xs text-green-600 font-medium">Actief</span>
                  )}
                  {tijdelijk.stop_tijd && tijdelijk.start_tijd && (
                    <span className="text-xs text-gray-500">{formatDuration(tijdelijk.start_tijd, tijdelijk.stop_tijd)}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nog geen tijdsregistratie</p>
              )}
            </div>

            {/* Stop button */}
            {tijdelijk.status === "ingecheckt" && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleStop}
                  disabled={stopping}
                >
                  {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Stoppen
                </Button>
              </div>
            )}
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