import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Nfc, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function generateNfcId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export default function NfcBadges() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: werknemers = [], isLoading } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.filter({ status: "actief" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, nfc_id }) => base44.entities.Werknemer.update(id, { nfc_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["werknemers"] }),
  });

  const filtered = werknemers.filter((w) => {
    const q = search.toLowerCase();
    return (
      `${w.voornaam} ${w.achternaam}`.toLowerCase().includes(q) ||
      (w.nfc_id || "").toLowerCase().includes(q)
    );
  });

  const getNfcUrl = (nfc_id) => {
    const base = window.location.origin;
    return `${base}/nfc?id=${nfc_id}`;
  };

  const copyUrl = (nfc_id) => {
    navigator.clipboard.writeText(getNfcUrl(nfc_id));
    toast.success("URL gekopieerd naar klembord");
  };

  const generateId = (werknemer) => {
    const nfc_id = generateNfcId();
    updateMut.mutate({ id: werknemer.id, nfc_id });
  };

  const regenerateId = (werknemer) => {
    if (!confirm(`Weet je zeker dat je de NFC badge van ${werknemer.voornaam} ${werknemer.achternaam} wilt vernieuwen? De oude badge/tag werkt dan niet meer.`)) return;
    generateId(werknemer);
  };

  const metBadge = filtered.filter(w => w.nfc_id);
  const zonderBadge = filtered.filter(w => !w.nfc_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">NFC Badges</h1>
          <p className="text-sm text-muted-foreground mt-1">Genereer unieke URL's per werknemer voor NFC tags</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-green-100 text-green-700">{metBadge.length} met badge</Badge>
          <Badge variant="secondary">{zonderBadge.length} zonder</Badge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek werknemer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Laden...</Card>
      ) : (
        <div className="space-y-3">
          {/* Without badge first */}
          {zonderBadge.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zonder badge</p>
              {zonderBadge.map((w) => (
                <Card key={w.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {w.voornaam?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{w.voornaam} {w.achternaam}</p>
                      <p className="text-xs text-muted-foreground">{w.functie || "Geen functie"}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => generateId(w)} disabled={updateMut.isPending} className="gap-1">
                    <Nfc className="w-4 h-4" /> Badge genereren
                  </Button>
                </Card>
              ))}
            </>
          )}

          {/* With badge */}
          {metBadge.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6">Met badge</p>
              {metBadge.map((w) => (
                <Card key={w.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                        {w.voornaam?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{w.voornaam} {w.achternaam}</p>
                        <p className="text-xs text-muted-foreground">{w.functie || "Geen functie"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" title="Kopieer URL" onClick={() => copyUrl(w.nfc_id)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Open URL" onClick={() => window.open(getNfcUrl(w.nfc_id), '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Vernieuw badge" onClick={() => regenerateId(w)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground break-all">
                    {getNfcUrl(w.nfc_id)}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}