import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, MapPin, Users, X } from "lucide-react";

const emptyForm = { naam: "", eindklant_id: "", beschrijving: "", status: "actief", toegewezen_werknemers: [] };

export default function Werkspots() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: werkspots = [], isLoading } = useQuery({
    queryKey: ["werkspots"],
    queryFn: () => base44.entities.Werkspot.list("-created_date"),
  });

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list(),
  });

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.filter({ status: "actief" }),
  });

  const { data: plaatsingen = [] } = useQuery({
    queryKey: ["plaatsingen"],
    queryFn: () => base44.entities.Plaatsing.filter({ status: "actief" }),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Werkspot.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["werkspots"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Werkspot.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["werkspots"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Werkspot.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["werkspots"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setForm(emptyForm); setEditId(null); };

  const openEdit = (ws) => {
    setForm({
      naam: ws.naam || "",
      eindklant_id: ws.eindklant_id || "",
      beschrijving: ws.beschrijving || "",
      status: ws.status || "actief",
      toegewezen_werknemers: ws.toegewezen_werknemers || [],
    });
    setEditId(ws.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const klant = klanten.find((k) => k.id === form.eindklant_id);
    const data = {
      ...form,
      eindklant_naam: klant?.naam || "",
    };
    editId ? updateMut.mutate({ id: editId, data }) : createMut.mutate(data);
  };

  // Get werknemers for selected klant in form
  const beschikbareWerknemers = useMemo(() => {
    if (!form.eindklant_id) return [];
    const werknemerIds = [...new Set(plaatsingen.filter(p => p.eindklant_id === form.eindklant_id).map(p => p.werknemer_id))];
    return werknemers.filter(w => werknemerIds.includes(w.id));
  }, [form.eindklant_id, plaatsingen, werknemers]);

  const toggleWerknemer = (id) => {
    setForm(prev => ({
      ...prev,
      toegewezen_werknemers: prev.toegewezen_werknemers.includes(id)
        ? prev.toegewezen_werknemers.filter(x => x !== id)
        : [...prev.toegewezen_werknemers, id]
    }));
  };

  const filtered = werkspots.filter((ws) =>
    (ws.naam || "").toLowerCase().includes(search.toLowerCase()) ||
    (ws.eindklant_naam || "").toLowerCase().includes(search.toLowerCase())
  );

  const getWerknemerNaam = (id) => {
    const w = werknemers.find(x => x.id === id);
    return w ? `${w.voornaam} ${w.achternaam}` : id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Werkspots</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Werkspot toevoegen
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Laden...</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Geen werkspots gevonden</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => (
            <Card key={ws.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-semibold">{ws.naam}</p>
                    <p className="text-xs text-muted-foreground">{ws.eindklant_naam}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(ws)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(ws.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {ws.beschrijving && <p className="text-sm text-muted-foreground">{ws.beschrijving}</p>}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {(ws.toegewezen_werknemers || []).length} werknemers
                </span>
                <Badge variant="secondary" className={ws.status === "actief" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                  {ws.status}
                </Badge>
              </div>
              {(ws.toegewezen_werknemers || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ws.toegewezen_werknemers.map(id => (
                    <Badge key={id} variant="outline" className="text-xs">{getWerknemerNaam(id)}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Werkspot bewerken" : "Nieuwe werkspot"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Naam *</Label>
              <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} placeholder="bijv. Hal A" required />
            </div>
            <div>
              <Label>Eindklant *</Label>
              <Select value={form.eindklant_id} onValueChange={(v) => setForm({ ...form, eindklant_id: v, toegewezen_werknemers: [] })}>
                <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
                <SelectContent>
                  {klanten.map((k) => <SelectItem key={k.id} value={k.id}>{k.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Input value={form.beschrijving} onChange={(e) => setForm({ ...form, beschrijving: e.target.value })} placeholder="Optionele beschrijving" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actief">Actief</SelectItem>
                  <SelectItem value="inactief">Inactief</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.eindklant_id && (
              <div>
                <Label>Werknemers toewijzen ({form.toegewezen_werknemers.length})</Label>
                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 mt-1">
                  {beschikbareWerknemers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Geen werknemers met actieve plaatsing bij deze klant</p>
                  ) : beschikbareWerknemers.map((w) => {
                    const selected = form.toegewezen_werknemers.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWerknemer(w.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          selected ? "bg-accent/10 text-accent font-medium" : "hover:bg-muted"
                        }`}
                      >
                        <span>{w.voornaam} {w.achternaam}</span>
                        {selected && <X className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Annuleren</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editId ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}