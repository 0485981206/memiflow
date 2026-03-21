import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const emptyForm = {
  werknemer_id: "", eindklant_id: "", startdatum: "", einddatum: "",
  functie: "", uurrooster: "", status: "actief", tarief: "",
};

export default function Plaatsingen() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: plaatsingen = [], isLoading } = useQuery({
    queryKey: ["plaatsingen"],
    queryFn: () => base44.entities.Plaatsing.list("-created_date"),
  });

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Plaatsing.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plaatsingen"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Plaatsing.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plaatsingen"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Plaatsing.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plaatsingen"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setForm(emptyForm); setEditId(null); };

  const openEdit = (p) => {
    setForm({
      werknemer_id: p.werknemer_id || "", eindklant_id: p.eindklant_id || "",
      startdatum: p.startdatum || "", einddatum: p.einddatum || "",
      functie: p.functie || "", uurrooster: p.uurrooster || "",
      status: p.status || "actief", tarief: p.tarief || "",
    });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const w = werknemers.find((x) => x.id === form.werknemer_id);
    const k = klanten.find((x) => x.id === form.eindklant_id);
    const data = {
      ...form,
      werknemer_naam: w ? `${w.voornaam} ${w.achternaam}` : "",
      eindklant_naam: k ? k.naam : "",
      tarief: form.tarief ? Number(form.tarief) : undefined,
    };
    editId ? updateMut.mutate({ id: editId, data }) : createMut.mutate(data);
  };

  const filtered = plaatsingen.filter((p) =>
    (p.werknemer_naam || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.eindklant_naam || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    actief: "bg-chart-5/10 text-chart-5",
    beeindigd: "bg-muted text-muted-foreground",
    gepland: "bg-chart-1/10 text-chart-1",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Plaatsingen</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Plaatsing toevoegen
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Werknemer</TableHead>
              <TableHead>Eindklant</TableHead>
              <TableHead className="hidden md:table-cell">Functie</TableHead>
              <TableHead className="hidden md:table-cell">Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen plaatsingen gevonden</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{p.werknemer_naam}</TableCell>
                <TableCell>{p.eindklant_naam}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{p.functie}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{p.startdatum}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[p.status] || ""}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Plaatsing bewerken" : "Nieuwe plaatsing"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Werknemer *</Label>
                <Select value={form.werknemer_id} onValueChange={(v) => setForm({ ...form, werknemer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies werknemer" /></SelectTrigger>
                  <SelectContent>
                    {werknemers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.voornaam} {w.achternaam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Eindklant *</Label>
                <Select value={form.eindklant_id} onValueChange={(v) => setForm({ ...form, eindklant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
                  <SelectContent>
                    {klanten.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Startdatum</Label><Input type="date" value={form.startdatum} onChange={(e) => setForm({ ...form, startdatum: e.target.value })} /></div>
              <div><Label>Einddatum</Label><Input type="date" value={form.einddatum} onChange={(e) => setForm({ ...form, einddatum: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Functie</Label><Input value={form.functie} onChange={(e) => setForm({ ...form, functie: e.target.value })} /></div>
              <div><Label>Tarief (€/uur)</Label><Input type="number" step="0.01" value={form.tarief} onChange={(e) => setForm({ ...form, tarief: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Uurrooster</Label><Input value={form.uurrooster} onChange={(e) => setForm({ ...form, uurrooster: e.target.value })} placeholder="bijv. 8u-17u" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="gepland">Gepland</SelectItem>
                    <SelectItem value="beeindigd">Beëindigd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Annuleren</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editId ? "Opslaan" : "Toevoegen"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}