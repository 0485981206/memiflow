import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, ClipboardList } from "lucide-react";

export default function Overzicht() {
  const [maand, setMaand] = useState(format(new Date(), "yyyy-MM"));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");

  const { data: prestaties = [], isLoading } = useQuery({
    queryKey: ["prestaties", maand],
    queryFn: () => base44.entities.Prestatie.filter({ maand }),
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["prestatiecodes"],
    queryFn: () => base44.entities.PrestatieCode.list(),
  });

  const filtered = prestaties.filter((p) => {
    const matchSearch =
      (p.werknemer_naam || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.eindklant_naam || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCodeColor = (code) => {
    const found = codes.find((c) => c.code === code);
    return found?.kleur || "#3b82f6";
  };

  const statusColors = {
    ingevoerd: "bg-chart-1/10 text-chart-1",
    goedgekeurd: "bg-chart-5/10 text-chart-5",
    afgekeurd: "bg-destructive/10 text-destructive",
  };

  const totalUren = filtered.reduce((s, p) => s + (p.uren || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-accent" />
        Prestatie Overzicht
      </h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="month"
          value={maand}
          onChange={(e) => setMaand(e.target.value)}
          className="w-48"
        />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="ingevoerd">Ingevoerd</SelectItem>
            <SelectItem value="goedgekeurd">Goedgekeurd</SelectItem>
            <SelectItem value="afgekeurd">Afgekeurd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} prestaties — Totaal: <span className="font-semibold text-foreground">{totalUren} uren</span>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Datum</TableHead>
              <TableHead>Werknemer</TableHead>
              <TableHead>Eindklant</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Uren</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen prestaties gevonden</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="text-muted-foreground">{p.datum}</TableCell>
                <TableCell className="font-medium">{p.werknemer_naam}</TableCell>
                <TableCell className="text-muted-foreground">{p.eindklant_naam}</TableCell>
                <TableCell>
                  <Badge className="text-white text-xs" style={{ backgroundColor: getCodeColor(p.code) }}>
                    {p.code}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{p.uren}u</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[p.status] || ""}>
                    {p.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}