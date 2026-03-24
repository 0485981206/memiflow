import React, { useState, useEffect } from "react";
import { getUISetting } from "@/lib/ui-settings";
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
import { Plus, Search, Upload, UserX } from "lucide-react";
import WerknemerDetail from "@/components/werknemers/WerknemerDetail";
import UploadWerknemersDialog from "@/components/werknemers/UploadWerknemersDialog";
import WerknemerWizard from "@/components/werknemers/WerknemerWizard";

const emptyForm = {
  voornaam: "", achternaam: "", overeenkomstnummer: "", externe_id: "",
  email: "", telefoon: "", contactnummer: "", noodcontact: "", functie: "", status: "actief",
  startdatum: "", einddatum: "", uurloon: "", rijksregisternummer: "", adres: "",
};

export default function Werknemers() {
  const [search, setSearch] = useState("");
  const [selectedWerknemer, setSelectedWerknemer] = useState(null);
  const [filters, setFilters] = useState({ type_overeenkomst: "", functie: "", werkregime: "", tewerkstellingsbreuk: "", barema_type: "", kostenplaats: "" });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(() => getUISetting("showUploadWerknemers", true));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => setShowUpload(getUISetting("showUploadWerknemers", true));
    window.addEventListener("ui-settings-changed", handler);
    return () => window.removeEventListener("ui-settings-changed", handler);
  }, []);

  const { data: werknemers = [], isLoading } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Werknemer.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["werknemers"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Werknemer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["werknemers"] }),
  });

  const handleFieldSave = async (id, data) => {
    await base44.entities.Werknemer.update(id, data);
    queryClient.invalidateQueries({ queryKey: ["werknemers"] });
    setSelectedWerknemer((prev) => prev ? { ...prev, ...data } : prev);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    base44.entities.Werknemer.create({ ...form, uurloon: form.uurloon ? Number(form.uurloon) : undefined })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["werknemers"] });
        setDialogOpen(false);
        setForm(emptyForm);
      });
  };

  const uniqueVals = (key) => [...new Set(werknemers.map((w) => w[key]).filter(Boolean))].sort();

  const filtered = werknemers.filter((w) => {
    const volledigeNaam = `${w.voornaam || ""} ${w.achternaam || ""}`.toLowerCase();
    const volledigeNaamOmgekeerd = `${w.achternaam || ""} ${w.voornaam || ""}`.toLowerCase();
    const woorden = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchSearch = woorden.length === 0 || woorden.every((woord) =>
      volledigeNaam.includes(woord) ||
      volledigeNaamOmgekeerd.includes(woord) ||
      (w.email || "").toLowerCase().includes(woord) ||
      (w.functie || "").toLowerCase().includes(woord) ||
      (w.overeenkomstnummer || "").toLowerCase().includes(woord)
    );
    const matchFilters = Object.entries(filters).every(([k, v]) => !v || w[k] === v);
    return matchSearch && matchFilters;
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
        <div className="flex gap-2">
          {showUpload && (
            <Button variant="outline" className="gap-2" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Werknemers uploaden
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Werknemer toevoegen
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
        </div>
        {["type_overeenkomst", "functie", "werkregime", "tewerkstellingsbreuk", "barema_type", "kostenplaats"].map((key) => (
          <Select key={key} value={filters[key] || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, [key]: v === "__all__" ? "" : v }))}>
            <SelectTrigger className="h-9 w-44 text-xs">
              <SelectValue placeholder={key.replace(/_/g, " ")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle {key.replace(/_/g, " ")}</SelectItem>
              {uniqueVals(key).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ type_overeenkomst: "", functie: "", werkregime: "", tewerkstellingsbreuk: "", barema_type: "", kostenplaats: "" })}>Filters wissen</Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Naam</TableHead>
              <TableHead className="hidden lg:table-cell">Overeenkomstnr.</TableHead>
              <TableHead className="hidden lg:table-cell">Extern ID</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Functie</TableHead>
              <TableHead className="hidden lg:table-cell">In dienst sinds</TableHead>
              <TableHead className="hidden lg:table-cell">Kostenplaats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Geen werknemers gevonden</TableCell></TableRow>
            ) : filtered.map((w) => (
              <TableRow key={w.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedWerknemer(w)}>
                <TableCell className="font-medium">{w.voornaam} {w.achternaam}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground font-mono text-xs">{w.overeenkomstnummer}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground font-mono text-xs">{w.externe_id}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{w.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{w.functie}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{w.startdatum || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{w.kostenplaats || "—"}</TableCell>
                <TableCell>
                  <Badge className={statusColors[w.status] || ""} variant="secondary">{w.status}</Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {w.status !== "inactief" && (
                    <Button size="sm" variant="outline" className="text-xs text-muted-foreground h-8 px-2" onClick={() => updateMut.mutate({ id: w.id, data: { status: "inactief" } })}>
                      <UserX className="w-3 h-3 mr-1" />Niet actief
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Nieuwe werknemer dialog */}
      <WerknemerWizard open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <UploadWerknemersDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      {selectedWerknemer && (
        <WerknemerDetail
          werknemer={selectedWerknemer}
          onClose={() => setSelectedWerknemer(null)}
          onSave={handleFieldSave}
          onDelete={(id) => { deleteMut.mutate(id); setSelectedWerknemer(null); }}
        />
      )}
    </div>
  );
}