import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const emptyForm = {
  voornaam: "",
  achternaam: "",
  overeenkomstnummer: "",
  externe_id: "",
  email: "",
  telefoon: "",
  functie: "",
  status: "actief",
  startdatum: "",
  einddatum: "",
  uurloon: "",
  rijksregisternummer: "",
  adres: "",
};

export default function Werknemers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: werknemers = [], isLoading } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Werknemer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["werknemers"] });
      closeDialog();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Werknemer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["werknemers"] });
      closeDialog();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Werknemer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["werknemers"] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
  };

  const openEdit = (w) => {
    setForm({
      voornaam: w.voornaam || "",
      achternaam: w.achternaam || "",
      email: w.email || "",
      telefoon: w.telefoon || "",
      functie: w.functie || "",
      status: w.status || "actief",
      startdatum: w.startdatum || "",
      uurloon: w.uurloon || "",
      rijksregisternummer: w.rijksregisternummer || "",
      adres: w.adres || "",
    });
    setEditId(w.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, uurloon: form.uurloon ? Number(form.uurloon) : undefined };
    if (editId) {
      updateMut.mutate({ id: editId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const filtered = werknemers.filter((w) => {
    const q = search.toLowerCase();
    return (
      (w.voornaam || "").toLowerCase().includes(q) ||
      (w.achternaam || "").toLowerCase().includes(q) ||
      (w.email || "").toLowerCase().includes(q) ||
      (w.functie || "").toLowerCase().includes(q)
    );
  });

  const statusColors = {
    actief: "bg-chart-5/10 text-chart-5",
    inactief: "bg-muted text-muted-foreground",
    ziekteverlof: "bg-chart-4/10 text-chart-4",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Werknemers</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Werknemer toevoegen
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoeken..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Naam</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Functie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Laden...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Geen werknemers gevonden
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {w.voornaam} {w.achternaam}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {w.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {w.functie}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[w.status] || ""} variant="secondary">
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(w)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMut.mutate(w.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Werknemer bewerken" : "Nieuwe werknemer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Voornaam *</Label>
                <Input
                  required
                  value={form.voornaam}
                  onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
                />
              </div>
              <div>
                <Label>Achternaam *</Label>
                <Input
                  required
                  value={form.achternaam}
                  onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefoon</Label>
                <Input
                  value={form.telefoon}
                  onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Functie</Label>
                <Input
                  value={form.functie}
                  onChange={(e) => setForm({ ...form, functie: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="inactief">Inactief</SelectItem>
                    <SelectItem value="ziekteverlof">Ziekteverlof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={form.startdatum}
                  onChange={(e) => setForm({ ...form, startdatum: e.target.value })}
                />
              </div>
              <div>
                <Label>Uurloon (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.uurloon}
                  onChange={(e) => setForm({ ...form, uurloon: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Rijksregisternummer</Label>
              <Input
                value={form.rijksregisternummer}
                onChange={(e) => setForm({ ...form, rijksregisternummer: e.target.value })}
              />
            </div>
            <div>
              <Label>Adres</Label>
              <Input
                value={form.adres}
                onChange={(e) => setForm({ ...form, adres: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuleren
              </Button>
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