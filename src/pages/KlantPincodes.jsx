import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Key, Eye, EyeOff, RefreshCw, Save, Users } from "lucide-react";

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function KlantPincodes() {
  const queryClient = useQueryClient();
  const [showPins, setShowPins] = useState({});
  const [editPins, setEditPins] = useState({});
  const [saving, setSaving] = useState({});

  const { data: klanten = [], isLoading } = useQuery({
    queryKey: ["eindklanten-pincodes"],
    queryFn: () => base44.entities.Eindklant.list(),
  });

  const { data: plaatsingen = [] } = useQuery({
    queryKey: ["plaatsingen-pincodes"],
    queryFn: () => base44.entities.Plaatsing.filter({ status: "actief" }),
  });

  const werknemerCountPerKlant = plaatsingen.reduce((acc, p) => {
    if (p.eindklant_id) acc[p.eindklant_id] = (acc[p.eindklant_id] || 0) + 1;
    return acc;
  }, {});

  const toggleShow = (id) => setShowPins((p) => ({ ...p, [id]: !p[id] }));

  const startEdit = (id, currentPin) => {
    setEditPins((p) => ({ ...p, [id]: currentPin || "" }));
  };

  const handleGenerate = (id) => {
    setEditPins((p) => ({ ...p, [id]: generatePin() }));
  };

  const handleSave = async (id) => {
    setSaving((p) => ({ ...p, [id]: true }));
    await base44.entities.Eindklant.update(id, { pincode: editPins[id] });
    setSaving((p) => ({ ...p, [id]: false }));
    setEditPins((p) => { const n = { ...p }; delete n[id]; return n; });
    queryClient.invalidateQueries(["eindklanten-pincodes"]);
  };

  const activeKlanten = klanten.filter((k) => k.status === "actief" || k.status === "Actief");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Key className="w-6 h-6 text-accent" /> Klant Pincodes
      </h1>
      <p className="text-sm text-muted-foreground">
        Beheer de 6-cijferige pincodes voor de klokregistratie. Teamleaders gebruiken deze pincode om in te loggen op <strong>/location</strong>.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {activeKlanten.map((k) => {
            const isEditing = editPins[k.id] !== undefined;
            const pin = isEditing ? editPins[k.id] : k.pincode || "";
            const visible = showPins[k.id];

            return (
              <Card key={k.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{k.naam}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>€{k.facturatie_tarief || 0}/uur</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{werknemerCountPerKlant[k.id] || 0}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={pin}
                          onChange={(e) => setEditPins((p) => ({ ...p, [k.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          className="w-32 text-center font-mono text-lg tracking-widest"
                          maxLength={6}
                          placeholder="000000"
                        />
                        <Button size="sm" variant="outline" onClick={() => handleGenerate(k.id)} title="Genereer pincode">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleSave(k.id)} disabled={pin.length !== 6 || saving[k.id]}>
                          <Save className="w-4 h-4 mr-1" /> Opslaan
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditPins((p) => { const n = { ...p }; delete n[k.id]; return n; })}>
                          Annuleer
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-32 text-center font-mono text-lg tracking-widest text-gray-700">
                          {pin ? (visible ? pin : "••••••") : <span className="text-gray-300 text-sm">Geen pincode</span>}
                        </div>
                        {pin && (
                          <Button size="icon" variant="ghost" onClick={() => toggleShow(k.id)} className="h-8 w-8">
                            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => startEdit(k.id, pin)}>
                          {pin ? "Wijzig" : "Stel in"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}