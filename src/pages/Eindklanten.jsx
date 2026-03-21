import React, { useState, useRef } from "react";
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
import { Plus, Search, Pencil, Trash2, Upload, FileText, X, Loader2, Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const emptyForm = {
  naam: "", contactpersoon: "", email: "", telefoon: "",
  adres: "", btw_nummer: "", status: "actief", facturatie_tarief: "",
  prestatie_pdf_url: "", prestatie_pdf_naam: "",
};

export default function Eindklanten() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: klanten = [], isLoading } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Eindklant.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["eindklanten"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Eindklant.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["eindklanten"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Eindklant.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eindklanten"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setForm(emptyForm); setEditId(null); };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, prestatie_pdf_url: file_url, prestatie_pdf_naam: file.name }));
    setIsUploading(false);
    e.target.value = "";
  };

  const openEdit = (k) => {
    setForm({
      naam: k.naam || "", contactpersoon: k.contactpersoon || "", email: k.email || "",
      telefoon: k.telefoon || "", adres: k.adres || "", btw_nummer: k.btw_nummer || "",
      status: k.status || "actief", facturatie_tarief: k.facturatie_tarief || "",
      prestatie_pdf_url: k.prestatie_pdf_url || "", prestatie_pdf_naam: k.prestatie_pdf_naam || "",
    });
    setEditId(k.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, facturatie_tarief: form.facturatie_tarief ? Number(form.facturatie_tarief) : undefined };
    editId ? updateMut.mutate({ id: editId, data }) : createMut.mutate(data);
  };

  const filtered = klanten.filter((k) =>
    (k.naam || "").toLowerCase().includes(search.toLowerCase()) ||
    (k.contactpersoon || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Eindklanten</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Klant toevoegen
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
              <TableHead>Naam</TableHead>
              <TableHead className="hidden md:table-cell">Contactpersoon</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">PDF</TableHead>
              <TableHead className="w-24">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Geen klanten gevonden</TableCell></TableRow>
            ) : filtered.map((k) => (
              <TableRow key={k.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{k.naam}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{k.contactpersoon}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{k.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={k.status === "actief" ? "bg-chart-5/10 text-chart-5" : "bg-muted text-muted-foreground"}>
                    {k.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {k.prestatie_pdf_url ? (
                    <a href={k.prestatie_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[100px] truncate">{k.prestatie_pdf_naam || "PDF"}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(k)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(k.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Klant bewerken" : "Nieuwe klant"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Bedrijfsnaam *</Label><Input required value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Contactpersoon</Label><Input value={form.contactpersoon} onChange={(e) => setForm({ ...form, contactpersoon: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} /></div>
              <div><Label>BTW-nummer</Label><Input value={form.btw_nummer} onChange={(e) => setForm({ ...form, btw_nummer: e.target.value })} /></div>
            </div>
            <div><Label>Adres</Label><Input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} /></div>
            <div>
              <Label>Prestatie PDF bijlage</Label>
              <input type="file" accept=".pdf" ref={fileInputRef} onChange={handlePdfUpload} className="hidden" />
              {form.prestatie_pdf_url ? (
                <div className="flex items-center gap-2 mt-1 p-2 border rounded-md bg-muted/30">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm flex-1 truncate">{form.prestatie_pdf_naam || "PDF bijlage"}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, prestatie_pdf_url: "", prestatie_pdf_naam: "" }))} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="mt-1 w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? "Uploaden..." : "PDF uploaden"}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div><Label>Tarief (€/uur)</Label><Input type="number" step="0.01" value={form.facturatie_tarief} onChange={(e) => setForm({ ...form, facturatie_tarief: e.target.value })} /></div>
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