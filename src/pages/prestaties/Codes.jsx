import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const emptyForm = { code: "", naam: "", kleur: "#3b82f6", type: "werk", standaard_uren: "8" };

export default function Codes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["prestatiecodes"],
    queryFn: () => base44.entities.PrestatieCode.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.PrestatieCode.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["prestatiecodes"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrestatieCode.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["prestatiecodes"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.PrestatieCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prestatiecodes"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setForm(emptyForm); setEditId(null); };

  const openEdit = (c) => {
    setForm({
      code: c.code || "", naam: c.naam || "", kleur: c.kleur || "#3b82f6",
      type: c.type || "werk", standaard_uren: String(c.standaard_uren || 8),
    });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, standaard_uren: Number(form.standaard_uren) || 8 };
    editId ? updateMut.mutate({ id: editId, data }) : createMut.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-accent" />
          Prestatie Codes
        </h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Code toevoegen
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Kleur</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Standaard uren</TableHead>
              <TableHead className="w-24">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : codes.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nog geen codes. Voeg er een toe.</TableCell></TableRow>
            ) : codes.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.kleur || "#3b82f6" }} />
                </TableCell>
                <TableCell className="font-bold">{c.code}</TableCell>
                <TableCell className="font-medium">{c.naam}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{c.type}</TableCell>
                <TableCell>{c.standaard_uren}u</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Code bewerken" : "Nieuwe code"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code *</Label><Input required maxLength={5} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="bijv. R" /></div>
              <div><Label>Kleur</Label><Input type="color" value={form.kleur} onChange={(e) => setForm({ ...form, kleur: e.target.value })} className="h-10" /></div>
            </div>
            <div><Label>Naam *</Label><Input required value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} placeholder="bijv. Regulier" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="werk">Werk</SelectItem>
                    <SelectItem value="afwezigheid">Afwezigheid</SelectItem>
                    <SelectItem value="overig">Overig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Standaard uren</Label><Input type="number" step="0.5" value={form.standaard_uren} onChange={(e) => setForm({ ...form, standaard_uren: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Annuleren</Button>
              <Button type="submit">{editId ? "Opslaan" : "Toevoegen"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}