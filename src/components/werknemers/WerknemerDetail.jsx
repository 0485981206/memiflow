import React, { useState, useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, Loader2, Search } from "lucide-react";

const statusColors = {
  actief: "bg-chart-5/10 text-chart-5",
  inactief: "bg-muted text-muted-foreground",
  ziekteverlof: "bg-chart-4/10 text-chart-4",
};

function EditableField({ label, value, fieldKey, onSave, type = "text", hidden }) {
  if (hidden) return null;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setVal(value || ""); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(fieldKey, val);
    setSaving(false);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setVal(value || ""); setEditing(false); }
  };

  if (!editing) {
    return (
      <div
        className="py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 group"
        onClick={() => setEditing(true)}
      >
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium min-h-[20px] text-foreground group-hover:text-primary transition-colors">
          {value || <span className="text-muted-foreground italic text-xs">Klik om te bewerken</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="py-2 border-b border-border/50 last:border-0 px-2 -mx-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1">
        <Input
          autoFocus
          type={type}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
        <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="mb-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-4">{title}</h3>
    <div className="bg-card rounded-lg border px-3">{children}</div>
  </div>
);

export default function WerknemerDetail({ werknemer, onClose, onSave, onDelete }) {
  const [fieldSearch, setFieldSearch] = useState("");
  const handleSave = async (key, value) => {
    await onSave(werknemer.id, { [key]: value });
  };

  const f = (key) => werknemer[key] || "";

  const matchesSearch = (label, value) => {
    if (!fieldSearch) return true;
    const q = fieldSearch.toLowerCase();
    return label.toLowerCase().includes(q) || String(value || "").toLowerCase().includes(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background border-l shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-4 py-3 z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-base">{f("voornaam")} {f("achternaam")}</h2>
              <p className="text-xs text-muted-foreground">{f("functie")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[werknemer.status] || "bg-muted"} variant="secondary">
                {werknemer.status || "actief"}
              </Badge>
              <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Zoek veld of waarde..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="px-4 pb-8">
          <p className="text-xs text-muted-foreground mt-3 mb-1 italic">Klik op een veld om het direct te bewerken.</p>

          <Section title="Identificatie">
            <EditableField label="Voornaam" value={f("voornaam")} fieldKey="voornaam" onSave={handleSave} hidden={!matchesSearch("Voornaam", f("voornaam"))} />
            <EditableField label="Achternaam" value={f("achternaam")} fieldKey="achternaam" onSave={handleSave} hidden={!matchesSearch("Achternaam", f("achternaam"))} />
            <EditableField label="Overeenkomstnummer" value={f("overeenkomstnummer")} fieldKey="overeenkomstnummer" onSave={handleSave} hidden={!matchesSearch("Overeenkomstnummer", f("overeenkomstnummer"))} />
            <EditableField label="Rijksregisternummer" value={f("rijksregisternummer")} fieldKey="rijksregisternummer" onSave={handleSave} hidden={!matchesSearch("Rijksregisternummer", f("rijksregisternummer"))} />
            <EditableField label="Geboortedatum" value={f("geboortedatum")} fieldKey="geboortedatum" onSave={handleSave} type="date" hidden={!matchesSearch("Geboortedatum", f("geboortedatum"))} />
            <EditableField label="Geslacht" value={f("geslacht")} fieldKey="geslacht" onSave={handleSave} hidden={!matchesSearch("Geslacht", f("geslacht"))} />
            <EditableField label="Nationaliteit" value={f("nationaliteit")} fieldKey="nationaliteit" onSave={handleSave} hidden={!matchesSearch("Nationaliteit", f("nationaliteit"))} />
            <EditableField label="Officiële taal" value={f("officiele_taal")} fieldKey="officiele_taal" onSave={handleSave} hidden={!matchesSearch("Officiële taal", f("officiele_taal"))} />
          </Section>

          <Section title="Contact">
            <EditableField label="E-mail" value={f("email")} fieldKey="email" onSave={handleSave} type="email" hidden={!matchesSearch("E-mail", f("email"))} />
            <EditableField label="Telefoon" value={f("telefoon")} fieldKey="telefoon" onSave={handleSave} hidden={!matchesSearch("Telefoon", f("telefoon"))} />
            <EditableField label="Contactnummer" value={f("contactnummer")} fieldKey="contactnummer" onSave={handleSave} hidden={!matchesSearch("Contactnummer", f("contactnummer"))} />
            <EditableField label="Noodcontact" value={f("noodcontact")} fieldKey="noodcontact" onSave={handleSave} hidden={!matchesSearch("Noodcontact", f("noodcontact"))} />
          </Section>

          <Section title="Adres">
            <EditableField label="Adres" value={f("adres")} fieldKey="adres" onSave={handleSave} hidden={!matchesSearch("Adres", f("adres"))} />
            <EditableField label="Land" value={f("land")} fieldKey="land" onSave={handleSave} hidden={!matchesSearch("Land", f("land"))} />
          </Section>

          <Section title="Persoonlijk">
            <EditableField label="Burgerlijke staat" value={f("burgerlijke_staat")} fieldKey="burgerlijke_staat" onSave={handleSave} hidden={!matchesSearch("Burgerlijke staat", f("burgerlijke_staat"))} />
            <EditableField label="Aantal kinderen ten laste" value={f("aantal_kinderen_ten_laste")} fieldKey="aantal_kinderen_ten_laste" onSave={handleSave} hidden={!matchesSearch("Aantal kinderen ten laste", f("aantal_kinderen_ten_laste"))} />
            <EditableField label="Personen 65+ ten laste" value={f("personen_65_plus_ten_laste")} fieldKey="personen_65_plus_ten_laste" onSave={handleSave} hidden={!matchesSearch("Personen 65+ ten laste", f("personen_65_plus_ten_laste"))} />
            <EditableField label="Persoon met handicap" value={f("persoon_met_handicap")} fieldKey="persoon_met_handicap" onSave={handleSave} hidden={!matchesSearch("Persoon met handicap", f("persoon_met_handicap"))} />
          </Section>

          <Section title="Tewerkstelling">
            <EditableField label="Datum in dienst" value={f("startdatum")} fieldKey="startdatum" onSave={handleSave} type="date" hidden={!matchesSearch("Datum in dienst", f("startdatum"))} />
            <EditableField label="Einddatum" value={f("einddatum")} fieldKey="einddatum" onSave={handleSave} type="date" hidden={!matchesSearch("Einddatum", f("einddatum"))} />
            <EditableField label="Functie" value={f("functie")} fieldKey="functie" onSave={handleSave} hidden={!matchesSearch("Functie", f("functie"))} />
            <EditableField label="Type overeenkomst" value={f("type_overeenkomst")} fieldKey="type_overeenkomst" onSave={handleSave} hidden={!matchesSearch("Type overeenkomst", f("type_overeenkomst"))} />
            <EditableField label="Werknemerstypering" value={f("werknemerstypering")} fieldKey="werknemerstypering" onSave={handleSave} hidden={!matchesSearch("Werknemerstypering", f("werknemerstypering"))} />
            <EditableField label="Paritair Comité" value={f("paritair_comite")} fieldKey="paritair_comite" onSave={handleSave} hidden={!matchesSearch("Paritair Comité", f("paritair_comite"))} />
            <EditableField label="Type werktijd" value={f("type_werktijd")} fieldKey="type_werktijd" onSave={handleSave} hidden={!matchesSearch("Type werktijd", f("type_werktijd"))} />
            <EditableField label="Werkregime" value={f("werkregime")} fieldKey="werkregime" onSave={handleSave} hidden={!matchesSearch("Werkregime", f("werkregime"))} />
            <EditableField label="Tewerkstellingsbreuk" value={f("tewerkstellingsbreuk")} fieldKey="tewerkstellingsbreuk" onSave={handleSave} hidden={!matchesSearch("Tewerkstellingsbreuk", f("tewerkstellingsbreuk"))} />
            <EditableField label="Berekeningswijze" value={f("berekeningswijze")} fieldKey="berekeningswijze" onSave={handleSave} hidden={!matchesSearch("Berekeningswijze", f("berekeningswijze"))} />
          </Section>

          <Section title="Barema & Loon">
            <EditableField label="Barema type" value={f("barema_type")} fieldKey="barema_type" onSave={handleSave} hidden={!matchesSearch("Barema type", f("barema_type"))} />
            <EditableField label="Barema code" value={f("barema_code")} fieldKey="barema_code" onSave={handleSave} hidden={!matchesSearch("Barema code", f("barema_code"))} />
            <EditableField label="Uurloon (€)" value={f("uurloon")} fieldKey="uurloon" onSave={handleSave} type="number" hidden={!matchesSearch("Uurloon", f("uurloon"))} />
            <EditableField label="Looncode 411 (Kledij)" value={f("looncode_411")} fieldKey="looncode_411" onSave={handleSave} hidden={!matchesSearch("Looncode 411", f("looncode_411"))} />
            <EditableField label="Looncode 591 (Maaltijdcheques)" value={f("looncode_591")} fieldKey="looncode_591" onSave={handleSave} hidden={!matchesSearch("Looncode 591", f("looncode_591"))} />
            <EditableField label="Looncode 691 (Werkgeversbijdr. MC)" value={f("looncode_691")} fieldKey="looncode_691" onSave={handleSave} hidden={!matchesSearch("Looncode 691", f("looncode_691"))} />
            <EditableField label="Looncode 104 (Nachtploeg)" value={f("looncode_104")} fieldKey="looncode_104" onSave={handleSave} hidden={!matchesSearch("Looncode 104", f("looncode_104"))} />
          </Section>

          <Section title="Organisatie">
            <EditableField label="Sturingsgroep" value={f("sturingsgroep")} fieldKey="sturingsgroep" onSave={handleSave} hidden={!matchesSearch("Sturingsgroep", f("sturingsgroep"))} />
            <EditableField label="Kostenplaats" value={f("kostenplaats")} fieldKey="kostenplaats" onSave={handleSave} hidden={!matchesSearch("Kostenplaats", f("kostenplaats"))} />
          </Section>
          {werknemer.status === "inactief" && (
            <div className="mt-4">
              <Button variant="outline" className="w-full text-chart-5 border-chart-5 hover:bg-chart-5/10" onClick={() => onSave(werknemer.id, { status: "actief" })}>
                Terug actief zetten
              </Button>
            </div>
          )}
          {werknemer.status === "inactief" && (
            <div className="mt-3 pt-4 border-t border-destructive/30">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Verwijder personeel</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Werknemer verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ben je zeker dat je <strong>{werknemer.voornaam} {werknemer.achternaam}</strong> permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { onDelete(werknemer.id); onClose(); }}>Ja, verwijderen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}