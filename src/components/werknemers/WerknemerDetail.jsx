import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, Loader2 } from "lucide-react";

const statusColors = {
  actief: "bg-chart-5/10 text-chart-5",
  inactief: "bg-muted text-muted-foreground",
  ziekteverlof: "bg-chart-4/10 text-chart-4",
};

function EditableField({ label, value, fieldKey, onSave, type = "text" }) {
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

export default function WerknemerDetail({ werknemer, onClose, onSave }) {
  const handleSave = async (key, value) => {
    await onSave(werknemer.id, { [key]: value });
  };

  const f = (key) => werknemer[key] || "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background border-l shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
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

        <div className="px-4 pb-8">
          <p className="text-xs text-muted-foreground mt-3 mb-1 italic">Klik op een veld om het direct te bewerken.</p>

          <Section title="Identificatie">
            <EditableField label="Voornaam" value={f("voornaam")} fieldKey="voornaam" onSave={handleSave} />
            <EditableField label="Achternaam" value={f("achternaam")} fieldKey="achternaam" onSave={handleSave} />
            <EditableField label="Overeenkomstnummer" value={f("overeenkomstnummer")} fieldKey="overeenkomstnummer" onSave={handleSave} />
            <EditableField label="Rijksregisternummer" value={f("rijksregisternummer")} fieldKey="rijksregisternummer" onSave={handleSave} />
            <EditableField label="Geboortedatum" value={f("geboortedatum")} fieldKey="geboortedatum" onSave={handleSave} type="date" />
            <EditableField label="Geslacht" value={f("geslacht")} fieldKey="geslacht" onSave={handleSave} />
            <EditableField label="Nationaliteit" value={f("nationaliteit")} fieldKey="nationaliteit" onSave={handleSave} />
            <EditableField label="Officiële taal" value={f("officiele_taal")} fieldKey="officiele_taal" onSave={handleSave} />
          </Section>

          <Section title="Contact">
            <EditableField label="E-mail" value={f("email")} fieldKey="email" onSave={handleSave} type="email" />
            <EditableField label="Telefoon" value={f("telefoon")} fieldKey="telefoon" onSave={handleSave} />
            <EditableField label="Contactnummer" value={f("contactnummer")} fieldKey="contactnummer" onSave={handleSave} />
            <EditableField label="Noodcontact" value={f("noodcontact")} fieldKey="noodcontact" onSave={handleSave} />
          </Section>

          <Section title="Adres">
            <EditableField label="Adres" value={f("adres")} fieldKey="adres" onSave={handleSave} />
            <EditableField label="Land" value={f("land")} fieldKey="land" onSave={handleSave} />
          </Section>

          <Section title="Persoonlijk">
            <EditableField label="Burgerlijke staat" value={f("burgerlijke_staat")} fieldKey="burgerlijke_staat" onSave={handleSave} />
            <EditableField label="Aantal kinderen ten laste" value={f("aantal_kinderen_ten_laste")} fieldKey="aantal_kinderen_ten_laste" onSave={handleSave} />
            <EditableField label="Personen 65+ ten laste" value={f("personen_65_plus_ten_laste")} fieldKey="personen_65_plus_ten_laste" onSave={handleSave} />
            <EditableField label="Persoon met handicap" value={f("persoon_met_handicap")} fieldKey="persoon_met_handicap" onSave={handleSave} />
          </Section>

          <Section title="Tewerkstelling">
            <EditableField label="Datum in dienst" value={f("startdatum")} fieldKey="startdatum" onSave={handleSave} type="date" />
            <EditableField label="Einddatum" value={f("einddatum")} fieldKey="einddatum" onSave={handleSave} type="date" />
            <EditableField label="Functie" value={f("functie")} fieldKey="functie" onSave={handleSave} />
            <EditableField label="Type overeenkomst" value={f("type_overeenkomst")} fieldKey="type_overeenkomst" onSave={handleSave} />
            <EditableField label="Werknemerstypering" value={f("werknemerstypering")} fieldKey="werknemerstypering" onSave={handleSave} />
            <EditableField label="Paritair Comité" value={f("paritair_comite")} fieldKey="paritair_comite" onSave={handleSave} />
            <EditableField label="Type werktijd" value={f("type_werktijd")} fieldKey="type_werktijd" onSave={handleSave} />
            <EditableField label="Werkregime" value={f("werkregime")} fieldKey="werkregime" onSave={handleSave} />
            <EditableField label="Tewerkstellingsbreuk" value={f("tewerkstellingsbreuk")} fieldKey="tewerkstellingsbreuk" onSave={handleSave} />
            <EditableField label="Berekeningswijze" value={f("berekeningswijze")} fieldKey="berekeningswijze" onSave={handleSave} />
          </Section>

          <Section title="Barema & Loon">
            <EditableField label="Barema type" value={f("barema_type")} fieldKey="barema_type" onSave={handleSave} />
            <EditableField label="Barema code" value={f("barema_code")} fieldKey="barema_code" onSave={handleSave} />
            <EditableField label="Uurloon (€)" value={f("uurloon")} fieldKey="uurloon" onSave={handleSave} type="number" />
            <EditableField label="Looncode 411 (Kledij)" value={f("looncode_411")} fieldKey="looncode_411" onSave={handleSave} />
            <EditableField label="Looncode 591 (Maaltijdcheques)" value={f("looncode_591")} fieldKey="looncode_591" onSave={handleSave} />
            <EditableField label="Looncode 691 (Werkgeversbijdr. MC)" value={f("looncode_691")} fieldKey="looncode_691" onSave={handleSave} />
            <EditableField label="Looncode 104 (Nachtploeg)" value={f("looncode_104")} fieldKey="looncode_104" onSave={handleSave} />
          </Section>

          <Section title="Organisatie">
            <EditableField label="Sturingsgroep" value={f("sturingsgroep")} fieldKey="sturingsgroep" onSave={handleSave} />
            <EditableField label="Kostenplaats" value={f("kostenplaats")} fieldKey="kostenplaats" onSave={handleSave} />
          </Section>
        </div>
      </div>
    </div>
  );
}