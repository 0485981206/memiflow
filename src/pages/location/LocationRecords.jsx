import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Loader2, CheckCircle2, ArrowRight, Pencil, Check, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const actief = records.filter((r) => r.status === "gestart");
  const gestopt = records.filter((r) => r.status === "gestopt");

  const reloadRecords = async () => {
    const res = await base44.functions.invoke("locationRecords", { eindklant_id: klant.id });
    setRecords(res.data.records || []);
  };

  const handleUpdateTime = async (recordId, field, value) => {
    await base44.functions.invoke("locationRecords", {
      action: "update_time",
      record_id: recordId,
      field,
      value,
    });
    await reloadRecords();
  };

  const handleDelete = async (recordId) => {
    await base44.functions.invoke("locationRecords", {
      action: "delete",
      record_id: recordId,
    });
    await reloadRecords();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="records" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-20">
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
                      <RecordRow key={r.id} record={r} tick={tick} onUpdateTime={handleUpdateTime} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )}
              {gestopt.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">Gestopt ({gestopt.length})</h2>
                  <div className="space-y-2">
                    {gestopt.map((r) => (
                      <RecordRow key={r.id} record={r} onUpdateTime={handleUpdateTime} onDelete={handleDelete} />
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

function RecordRow({ record, tick, onUpdateTime, onDelete }) {
  const isActive = record.status === "gestart";
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (field) => {
    setEditField(field);
    setEditValue(field === "start_tijd" ? record.start_tijd : record.stop_tijd || "");
  };

  const handleSave = () => {
    if (editValue && /^\d{2}:\d{2}$/.test(editValue)) {
      onUpdateTime(record.id, editField, editValue);
    }
    setEditField(null);
  };

  const handleCancel = () => setEditField(null);

  return (
    <div className={`bg-white rounded-lg border p-3 flex items-center justify-between group ${isActive ? "border-green-200" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
          {(record.werknemer_naam || "?").charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{record.werknemer_naam}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {editField === "start_tijd" ? (
              <TimeEditor value={editValue} onChange={setEditValue} onSave={handleSave} onCancel={handleCancel} />
            ) : (
              <button onClick={() => handleEdit("start_tijd")} className="hover:text-blue-500 flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors">
                {record.start_tijd} <Pencil className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
              </button>
            )}
            {(record.stop_tijd || isActive) && (
              <>
                <ArrowRight className="w-3 h-3" />
                {record.stop_tijd ? (
                  editField === "stop_tijd" ? (
                    <TimeEditor value={editValue} onChange={setEditValue} onSave={handleSave} onCancel={handleCancel} />
                  ) : (
                    <button onClick={() => handleEdit("stop_tijd")} className="hover:text-blue-500 flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors">
                      {record.stop_tijd} <Pencil className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                    </button>
                  )
                ) : (
                  <span className="text-green-600 font-medium">nu</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          {isActive && record.start_tijd && (
            <LiveTimer startTime={record.start_tijd} />
          )}
          {!isActive && record.stop_tijd && record.start_tijd && (
            <span className="text-sm font-semibold text-gray-600">
              {formatDuration(record.start_tijd, record.stop_tijd)}
            </span>
          )}
          {isActive && (
            <p className="text-[10px] text-green-600 font-medium animate-pulse">Actief</p>
          )}
        </div>
        {!isActive && onDelete && (
          <button
            onClick={() => onDelete(record.id)}
            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function TimeEditor({ value, onChange, onSave, onCancel }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-20 text-xs px-1 py-0"
        autoFocus
      />
      <button onClick={onSave} className="text-green-500 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
    </span>
  );
}

function LiveTimer({ startTime }) {
  const [sh, sm] = startTime.split(":").map(Number);
  const now = new Date();
  const startMins = sh * 60 + sm;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const elapsed = Math.max(0, nowMins - startMins);
  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;
  return (
    <span className="text-sm font-bold text-green-600 tabular-nums">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
    </span>
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