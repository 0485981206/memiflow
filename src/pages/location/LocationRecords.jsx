import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Loader2, ArrowRight, X, Trash2, Search, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { format, parseISO, isToday, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationRecords({ klant, onNavigate, onLogout, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);

  const selectedDateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const loadAll = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("locationRecords", { eindklant_id: klant.id, start_date: selectedDateStr });
    setRecords(res.data.records || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(), 30000);
    return () => clearInterval(interval);
  }, [klant.id, selectedDateStr]);

  const now = new Date();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredRecords = useMemo(() => {
    // Alleen volledige records (gestopt, met in én uit)
    let result = records.filter(r => r.status === "gestopt" && r.start_tijd && r.stop_tijd);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => (r.werknemer_naam || "").toLowerCase().includes(q));
    }
    return result;
  }, [records, search]);

  // Group by datum
  const groupedByDate = useMemo(() => {
    const groups = {};
    for (const r of filteredRecords) {
      const key = r.datum || "onbekend";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    // Sort dates descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  const actief = records.filter((r) => r.status === "gestart");
  const gestopt = records.filter((r) => r.status === "gestopt");

  const reloadRecords = async () => {
    const res = await base44.functions.invoke("locationRecords", { eindklant_id: klant.id, start_date: selectedDateStr });
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
      <LocationSidebar activePage="records" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
        <div className="bg-[#0f2744] text-white px-6 py-4">
          <h1 className="text-lg font-bold">Registraties — {klant.naam}</h1>
          <p className="text-xs text-white/60">
            {format(now, "EEEE d MMMM yyyy", { locale: nl })} — {actief.length} actief, {gestopt.length} gestopt
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Zoekbalk en filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek werknemer..."
                className="pl-9 pr-9 h-10"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!isToday(selectedDate) && (
              <Button variant="outline" size="sm" className="h-10 text-xs" onClick={() => setSelectedDate(new Date())}>
                Vandaag
              </Button>
            )}
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-10 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  {isToday(selectedDate) ? "Vandaag" : format(selectedDate, "d MMM yyyy", { locale: nl })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { if (d) { setSelectedDate(d); setCalOpen(false); } }}
                  disabled={(d) => d > new Date()}
                  locale={nl}
                />
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>{search ? "Geen resultaten gevonden" : "Geen registraties"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByDate.map(([datum, dayRecords]) => {
                const dateObj = parseISO(datum);
                const dayActief = dayRecords.filter(r => r.status === "gestart");
                const dayGestopt = dayRecords.filter(r => r.status === "gestopt");
                const isVandaag = isToday(dateObj);

                return (
                  <div key={datum}>
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-50 py-2 z-10">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h2 className="text-sm font-bold text-foreground">
                        {isVandaag ? "Vandaag" : format(dateObj, "EEEE d MMMM", { locale: nl })}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        — {dayRecords.length} registratie{dayRecords.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayRecords.map(r => (
                        <RecordRow key={r.id} record={r} onUpdateTime={handleUpdateTime} onDelete={handleDelete} reloadRecords={reloadRecords} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordRow({ record, onUpdateTime, onDelete, reloadRecords }) {
  const isActive = record.status === "gestart";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editStart, setEditStart] = useState(record.start_tijd || "");
  const [editStop, setEditStop] = useState(record.stop_tijd || "");
  const [editDatum, setEditDatum] = useState(record.datum || "");
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setEditStart(record.start_tijd || "");
    setEditStop(record.stop_tijd || "");
    setEditDatum(record.datum || "");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editStart !== record.start_tijd) await onUpdateTime(record.id, "start_tijd", editStart);
    if (editStop !== record.stop_tijd) await onUpdateTime(record.id, "stop_tijd", editStop);
    if (editDatum !== record.datum) await onUpdateTime(record.id, "datum", editDatum);
    setSaving(false);
    setSheetOpen(false);
    reloadRecords?.();
  };

  const handleDelete = () => {
    onDelete(record.id);
    setSheetOpen(false);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className={`bg-white rounded-lg border p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100 select-none touch-manipulation ${
          isActive ? "border-green-200" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
            {(record.werknemer_naam || "?").charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{record.werknemer_naam}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{record.start_tijd}</span>
              {(record.stop_tijd || isActive) && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  {record.stop_tijd ? (
                    <span>{record.stop_tijd}</span>
                  ) : (
                    <span className="text-green-600 font-medium">nu</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          {isActive && record.start_tijd && <LiveTimer startTime={record.start_tijd} />}
          {!isActive && record.stop_tijd && record.start_tijd && (
            <span className="text-sm font-semibold text-gray-600">{formatDuration(record.start_tijd, record.stop_tijd)}</span>
          )}
          {isActive && <p className="text-[10px] text-green-600 font-medium animate-pulse">Actief</p>}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-base">Registratie bewerken</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
                {(record.werknemer_naam || "?").charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{record.werknemer_naam}</p>
                <p className="text-xs text-muted-foreground">{record.eindklant_naam}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Datum</Label>
                <Input type="date" value={editDatum} onChange={(e) => setEditDatum(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Starttijd</Label>
                  <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Stoptijd</Label>
                  <Input type="time" value={editStop} onChange={(e) => setEditStop(e.target.value)} className="mt-1" disabled={isActive} />
                </div>
              </div>
              {editStart && editStop && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Totaal</p>
                  <p className="text-lg font-bold">{formatDuration(editStart, editStop)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan"}
              </Button>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleDelete} disabled={isActive}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
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