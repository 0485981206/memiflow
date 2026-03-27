import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Square, Clock, Loader2, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationTijdelijk({ klant, onNavigate, onLogout, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", telefoon: "", opmerking: "" });

  const loadRecords = async () => {
    const res = await base44.functions.invoke("tijdelijkeWerknemer", {
      action: "list",
      eindklant_id: klant.id,
    });
    setRecords(res.data.records || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, [klant.id]);

  const handleCreate = async () => {
    if (!form.voornaam.trim() || !form.achternaam.trim()) return;
    setSaving(true);
    await base44.functions.invoke("tijdelijkeWerknemer", {
      action: "create",
      voornaam: form.voornaam.trim(),
      achternaam: form.achternaam.trim(),
      telefoon: form.telefoon.trim(),
      opmerking: form.opmerking.trim(),
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
    });
    setForm({ voornaam: "", achternaam: "", telefoon: "", opmerking: "" });
    setShowForm(false);
    setSaving(false);
    await loadRecords();
  };

  const handleStop = async (id) => {
    await base44.functions.invoke("tijdelijkeWerknemer", { action: "stop", id });
    await loadRecords();
  };

  const now = new Date();
  const actief = records.filter((r) => r.status === "ingecheckt");
  const overig = records.filter((r) => r.status !== "ingecheckt");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="tijdelijk" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
        <div className="bg-[#0f2744] text-white px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{klant.naam}</h1>
            <p className="text-xs text-white/60">
              Tijdelijke werknemers — {format(now, "d MMMM yyyy", { locale: nl })}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-1"
            onClick={() => setShowForm(true)}
          >
            <UserPlus className="w-4 h-4" /> Toevoegen
          </Button>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          {showForm && (
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Nieuwe tijdelijke werknemer</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Voornaam *"
                  value={form.voornaam}
                  onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
                />
                <Input
                  placeholder="Achternaam *"
                  value={form.achternaam}
                  onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
                />
              </div>
              <Input
                placeholder="Telefoonnummer"
                value={form.telefoon}
                onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
              />
              <Input
                placeholder="Opmerking"
                value={form.opmerking}
                onChange={(e) => setForm({ ...form, opmerking: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={saving || !form.voornaam.trim() || !form.achternaam.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inchecken"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuleren</Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : records.length === 0 && !showForm ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen tijdelijke werknemers vandaag</p>
            </div>
          ) : (
            <>
              {actief.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                    Actief ({actief.length})
                  </h3>
                  <div className="space-y-2">
                    {actief.map((r) => (
                      <TijdelijkRow key={r.id} record={r} onStop={handleStop} />
                    ))}
                  </div>
                </div>
              )}
              {overig.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Afgelopen ({overig.length})
                  </h3>
                  <div className="space-y-2">
                    {overig.map((r) => (
                      <TijdelijkRow key={r.id} record={r} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TijdelijkRow({ record, onStop }) {
  const isActive = record.status === "ingecheckt";
  const naam = `${record.voornaam} ${record.achternaam}`;

  return (
    <div className={`bg-white rounded-lg border p-3 flex items-center justify-between ${isActive ? "border-green-200" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
          {naam.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{naam}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{record.start_tijd}</span>
            {record.stop_tijd && (
              <>
                <ArrowRight className="w-3 h-3" />
                <span>{record.stop_tijd}</span>
              </>
            )}
            {record.telefoon && <span className="ml-2">📞 {record.telefoon}</span>}
          </div>
          {record.opmerking && <p className="text-[10px] text-gray-400 mt-0.5">{record.opmerking}</p>}
          {record.status === "gekoppeld" && (
            <p className="text-[10px] text-blue-500 mt-0.5">✓ Gekoppeld: {record.gekoppeld_werknemer_naam}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isActive && onStop && (
          <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => onStop(record.id)}>
            <Square className="w-3 h-3" /> Stop
          </Button>
        )}
        {record.stop_tijd && record.start_tijd && (
          <span className="text-sm font-semibold text-gray-500">
            {formatDuration(record.start_tijd, record.stop_tijd)}
          </span>
        )}
      </div>
    </div>
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