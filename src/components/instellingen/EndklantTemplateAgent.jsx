import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";

const fieldTypes = [
  { id: "werknemer_naam", label: "Werknemersnaam" },
  { id: "datum", label: "Datum" },
  { id: "uren", label: "Uren" },
  { id: "functie", label: "Functie" },
  { id: "code", label: "Prestatiecode" },
];

export default function EndklantTemplateAgent() {
  const [selectedKlantId, setSelectedKlantId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [newField, setNewField] = useState({ fieldType: "", regex: "", beschrijving: "" });
  const queryClient = useQueryClient();

  const { data: klanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list("-created_date"),
  });

  const { data: selectedKlant } = useQuery({
    queryKey: ["eindklant", selectedKlantId],
    queryFn: () => base44.entities.Eindklant.get(selectedKlantId),
    enabled: !!selectedKlantId,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Eindklant.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eindklant", selectedKlantId] }),
  });

  useEffect(() => {
    if (selectedKlant?.pdf_instructies) {
      try {
        const parsed = JSON.parse(selectedKlant.pdf_instructies);
        setTemplates(Array.isArray(parsed) ? parsed : []);
      } catch {
        setTemplates([]);
      }
    } else {
      setTemplates([]);
    }
  }, [selectedKlant]);

  const addField = () => {
    if (!newField.fieldType) return;
    const field = {
      id: Date.now(),
      fieldType: newField.fieldType,
      regex: newField.regex || "",
      beschrijving: newField.beschrijving || "",
    };
    setTemplates([...templates, field]);
    setNewField({ fieldType: "", regex: "", beschrijving: "" });
  };

  const removeField = (id) => {
    setTemplates(templates.filter((f) => f.id !== id));
  };

  const saveTemplate = () => {
    if (!selectedKlantId) return;
    updateMut.mutate({
      id: selectedKlantId,
      data: { pdf_instructies: JSON.stringify(templates) },
    });
  };

  const getFieldLabel = (fieldType) => {
    return fieldTypes.find((f) => f.id === fieldType)?.label || fieldType;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Selecteer een Eindklant</h2>
        <Select value={selectedKlantId} onValueChange={setSelectedKlantId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Kies een eindklant..." />
          </SelectTrigger>
          <SelectContent>
            {klanten.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.naam}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedKlant && (
        <Card>
          <CardHeader>
            <CardTitle>PDF Template voor {selectedKlant.naam}</CardTitle>
            <CardDescription>
              Definieer welke velden de agent uit de PDF moet halen en hoe deze te herkennen zijn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bestaande velden */}
            {templates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Gedefinieerde velden</h3>
                <div className="space-y-2">
                  {templates.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-start justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>{getFieldLabel(field.fieldType)}</Badge>
                        </div>
                        {field.beschrijving && (
                          <p className="text-sm text-muted-foreground mb-1">{field.beschrijving}</p>
                        )}
                        {field.regex && (
                          <code className="text-xs bg-muted p-1 rounded block">
                            Regex: {field.regex}
                          </code>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive ml-2"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nieuw veld toevoegen */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Voeg veld toe</h3>
              <div className="space-y-3">
                <div>
                  <Label>Veldtype *</Label>
                  <Select value={newField.fieldType} onValueChange={(v) => setNewField({ ...newField, fieldType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer veldtype..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Beschrijving (hoe te herkennen in PDF)</Label>
                  <Textarea
                    value={newField.beschrijving}
                    onChange={(e) => setNewField({ ...newField, beschrijving: e.target.value })}
                    placeholder="Bijv. 'De werknemersnaam staat in het formaat Voornaam Achternaam boven aan de pagina'"
                    className="h-20 text-sm"
                  />
                </div>
                <div>
                  <Label>Regex patroon (optioneel)</Label>
                  <Input
                    value={newField.regex}
                    onChange={(e) => setNewField({ ...newField, regex: e.target.value })}
                    placeholder="Bijv. ^([A-Z][a-z]+ [A-Z][a-z]+)$ voor volle namen"
                    className="text-sm"
                  />
                </div>
                <Button onClick={addField} className="w-full gap-2" variant="outline">
                  <Plus className="w-4 h-4" /> Veld toevoegen
                </Button>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={saveTemplate} disabled={updateMut.isPending} className="gap-2">
                <Save className="w-4 h-4" />
                {updateMut.isPending ? "Opslaan..." : "Template opslaan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}