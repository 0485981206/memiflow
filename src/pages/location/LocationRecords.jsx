import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationRecords({ klant, onNavigate, onLogout }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await base44.functions.invoke("locationRecords", { eindklant_id: klant.id });
      setRecords(res.data.records || []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000); // refresh elke 30s
    return () => clearInterval(interval);
  }, [klant.id]);

  const now = new Date();
  const actief = records.filter((r) => r.status === "gestart");
  const gestopt = records.filter((r) => r.status === "gestopt");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="records" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-16">
        <div className="bg-[#0f2744] text-white px-6 py-4">
          <h1 className="text-lg font-bold">Registraties — {klant.naam}</h1>
          <p className="text-xs text-white/60">
            {format(now, "EEEE d MMMM yyyy", { locale: nl })} — {actief.length} actief, {gestopt.length} gestopt
          </p>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Geen registraties vandaag</p>
            </div>
          ) : (
            <>
              {actief.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Actief ({actief.length})
                  </h2>
                  <div className="space-y-2">
                    {actief.map((r) => (
                      <RecordRow key={r.id} record={r} />
                    ))}
                  </div>
                </div>
              )}
              {gestopt.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">Gestopt ({gestopt.length})</h2>
                  <div className="space-y-2">
                    {gestopt.map((r) => (
                      <RecordRow key={r.id} record={r} />
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

function RecordRow({ record }) {
  const isActive = record.status === "gestart";

  return (
    <div className={`bg-white rounded-lg border p-3 flex items-center justify-between ${isActive ? "border-green-200" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
          {(record.werknemer_naam || "?").charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{record.werknemer_naam}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{record.start_tijd}</span>
            {record.stop_tijd && (
              <>
                <ArrowRight className="w-3 h-3" />
                <span>{record.stop_tijd}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {record.stop_tijd && record.start_tijd && (
        <span className="text-xs font-medium text-gray-500">
          {calcHours(record.start_tijd, record.stop_tijd)}u
        </span>
      )}
      {isActive && (
        <span className="text-xs text-green-600 font-medium animate-pulse">Actief</span>
      )}
    </div>
  );
}

function calcHours(start, stop) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = stop.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return (Math.round((mins / 60) * 100) / 100).toFixed(1);
}