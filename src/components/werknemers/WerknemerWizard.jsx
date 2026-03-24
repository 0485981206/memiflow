import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Heart, Briefcase, DollarSign, Building2, Check } from "lucide-react";

const STEPS = [
  { label: "Identiteit", icon: User },
  { label: "Contact & Adres", icon: MapPin },
  { label: "Persoonlijk", icon: Heart },
  { label: "Tewerkstelling", icon: Briefcase },
  { label: "Barema & Loon", icon: DollarSign },
  { label: "Organisatie", icon: Building2 },
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DatalistField({ label, value, onChange, listId, options = [], placeholder = "" }) {
  return (
    <Field label={label}>
      <input
        list={listId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </Field>
  );
}

export default function WerknemerWizard({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: bestaande = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
    enabled: open,
  });

  const uniq = (key) => [...new Set(bestaande.map((w) => w[key]).filter(Boolean))].sort();
  const [werknemerId, setWerknemerId] = useState(null);
  const [form, setForm] = useState({
    voornaam: "", achternaam: "", overeenkomstnummer: "", externe_id: "",
    rijksregisternummer: "", geboortedatum: "", geslacht: "", nationaliteit: "", officiele_taal: "",
    email: "", telefoon: "", contactnummer: "", noodcontact: "", adres: "", land: "",
    burgerlijke_staat: "", aantal_kinderen_ten_laste: "", personen_65_plus_ten_laste: "",
    persoon_met_handicap: "",
    startdatum: "", einddatum: "", functie: "", status: "actief", type_overeenkomst: "",
    werknemerstypering: "", paritair_comite: "", type_werktijd: "", werkregime: "",
    tewerkstellingsbreuk: "", berekeningswijze: "", uurloon: "",
    barema_type: "", barema_code: "", looncode_411: "", looncode_591: "", looncode_691: "", looncode_104: "",
    sturingsgroep: "", kostenplaats: "",
  });
  const queryClient = useQueryClient();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target ? e.target.value : e }));

  const getStepData = (s) => {
    const keys = [
      ["voornaam","achternaam","overeenkomstnummer","externe_id","rijksregisternummer","geboortedatum","geslacht","nationaliteit","officiele_taal"],
      ["email","telefoon","contactnummer","noodcontact","adres","land"],
      ["burgerlijke_staat","aantal_kinderen_ten_laste","personen_65_plus_ten_laste","persoon_met_handicap"],
      ["startdatum","einddatum","functie","status","type_overeenkomst","werknemerstypering","paritair_comite","type_werktijd","werkregime","tewerkstellingsbreuk","berekeningswijze","uurloon"],
      ["barema_type","barema_code","looncode_411","looncode_591","looncode_691","looncode_104"],
      ["sturingsgroep","kostenplaats"],
    ][s];
    return Object.fromEntries(keys.map((k) => [k, form[k]]));
  };

  const handleNext = async () => {
    if (step === 0 && !form.voornaam.trim()) return;
    setSaving(true);
    const data = getStepData(step);
    if (form.uurloon) data.uurloon = Number(form.uurloon);
    try {
      if (step === 0 && !werknemerId) {
        const w = await base44.entities.Werknemer.create(data);
        setWerknemerId(w.id);
      } else if (werknemerId) {
        await base44.entities.Werknemer.update(werknemerId, data);
      }
      queryClient.invalidateQueries({ queryKey: ["werknemers"] });
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        handleClose(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (done = false) => {
    setStep(0);
    setWerknemerId(null);
    setForm({
      voornaam: "", achternaam: "", overeenkomstnummer: "", externe_id: "",
      rijksregisternummer: "", geboortedatum: "", geslacht: "", nationaliteit: "", officiele_taal: "",
      email: "", telefoon: "", contactnummer: "", noodcontact: "", adres: "", land: "",
      burgerlijke_staat: "", aantal_kinderen_ten_laste: "", personen_65_plus_ten_laste: "", persoon_met_handicap: "",
      startdatum: "", einddatum: "", functie: "", status: "actief", type_overeenkomst: "",
      werknemerstypering: "", paritair_comite: "", type_werktijd: "", werkregime: "",
      tewerkstellingsbreuk: "", berekeningswijze: "", uurloon: "",
      barema_type: "", barema_code: "", looncode_411: "", looncode_591: "", looncode_691: "", looncode_104: "",
      sturingsgroep: "", kostenplaats: "",
    });
    onClose();
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe werknemer</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 mt-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors
                    ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-primary text-primary bg-primary/10" : "border-muted-foreground/30 text-muted-foreground/40"}`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground/40"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="min-h-[280px]">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Voornaam *"><Input value={form.voornaam} onChange={set("voornaam")} placeholder="Voornaam" /></Field>
              <Field label="Achternaam *"><Input value={form.achternaam} onChange={set("achternaam")} placeholder="Achternaam" /></Field>
              <Field label="Overeenkomstnummer"><Input value={form.overeenkomstnummer} onChange={set("overeenkomstnummer")} /></Field>
              <Field label="Extern ID"><Input value={form.externe_id} onChange={set("externe_id")} /></Field>
              <Field label="Rijksregisternummer"><Input value={form.rijksregisternummer} onChange={set("rijksregisternummer")} /></Field>
              <Field label="Geboortedatum"><Input type="date" value={form.geboortedatum} onChange={set("geboortedatum")} /></Field>
              <DatalistField label="Geslacht" value={form.geslacht} onChange={set("geslacht")} listId="dl-geslacht" options={["Man","Vrouw","X",...uniq("geslacht")]} placeholder="bv. Man / Vrouw" />
              <DatalistField label="Nationaliteit" value={form.nationaliteit} onChange={set("nationaliteit")} listId="dl-nationaliteit" options={uniq("nationaliteit")} />
              <DatalistField label="Officiële taal" value={form.officiele_taal} onChange={set("officiele_taal")} listId="dl-taal" options={uniq("officiele_taal")} />
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail"><Input type="email" value={form.email} onChange={set("email")} /></Field>
              <Field label="Telefoon"><Input value={form.telefoon} onChange={set("telefoon")} /></Field>
              <Field label="Contactnummer"><Input value={form.contactnummer} onChange={set("contactnummer")} /></Field>
              <Field label="Noodcontact"><Input value={form.noodcontact} onChange={set("noodcontact")} /></Field>
              <div className="col-span-2"><Field label="Adres"><Input value={form.adres} onChange={set("adres")} /></Field></div>
              <DatalistField label="Land" value={form.land} onChange={set("land")} listId="dl-land" options={uniq("land")} />
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <DatalistField label="Burgerlijke staat" value={form.burgerlijke_staat} onChange={set("burgerlijke_staat")} listId="dl-bst" options={uniq("burgerlijke_staat")} />
              <DatalistField label="Aantal kinderen ten laste" value={form.aantal_kinderen_ten_laste} onChange={set("aantal_kinderen_ten_laste")} listId="dl-kind" options={uniq("aantal_kinderen_ten_laste")} />
              <DatalistField label="Personen 65+ ten laste" value={form.personen_65_plus_ten_laste} onChange={set("personen_65_plus_ten_laste")} listId="dl-65" options={uniq("personen_65_plus_ten_laste")} />
              <DatalistField label="Persoon met handicap" value={form.persoon_met_handicap} onChange={set("persoon_met_handicap")} listId="dl-hnd" options={uniq("persoon_met_handicap")} />
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Startdatum"><Input type="date" value={form.startdatum} onChange={set("startdatum")} /></Field>
              <Field label="Einddatum"><Input type="date" value={form.einddatum} onChange={set("einddatum")} /></Field>
              <DatalistField label="Functie" value={form.functie} onChange={set("functie")} listId="dl-functie" options={uniq("functie")} />
              <Field label="Status">
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="inactief">Inactief</SelectItem>
                    <SelectItem value="ziekteverlof">Ziekteverlof</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <DatalistField label="Type overeenkomst" value={form.type_overeenkomst} onChange={set("type_overeenkomst")} listId="dl-tov" options={uniq("type_overeenkomst")} />
              <DatalistField label="Werknemerstypering" value={form.werknemerstypering} onChange={set("werknemerstypering")} listId="dl-wt" options={uniq("werknemerstypering")} />
              <DatalistField label="Paritair Comité" value={form.paritair_comite} onChange={set("paritair_comite")} listId="dl-pc" options={uniq("paritair_comite")} />
              <DatalistField label="Type werktijd" value={form.type_werktijd} onChange={set("type_werktijd")} listId="dl-twt" options={uniq("type_werktijd")} />
              <DatalistField label="Werkregime" value={form.werkregime} onChange={set("werkregime")} listId="dl-wr" options={uniq("werkregime")} />
              <DatalistField label="Tewerkstellingsbreuk" value={form.tewerkstellingsbreuk} onChange={set("tewerkstellingsbreuk")} listId="dl-tb" options={uniq("tewerkstellingsbreuk")} />
              <DatalistField label="Berekeningswijze" value={form.berekeningswijze} onChange={set("berekeningswijze")} listId="dl-bw" options={uniq("berekeningswijze")} />
              <Field label="Uurloon (€)"><Input type="number" step="0.01" value={form.uurloon} onChange={set("uurloon")} /></Field>
            </div>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <DatalistField label="Barema type" value={form.barema_type} onChange={set("barema_type")} listId="dl-bt" options={uniq("barema_type")} />
              <DatalistField label="Barema code" value={form.barema_code} onChange={set("barema_code")} listId="dl-bc" options={uniq("barema_code")} />
              <DatalistField label="Looncode 411 (Kledij)" value={form.looncode_411} onChange={set("looncode_411")} listId="dl-411" options={uniq("looncode_411")} />
              <DatalistField label="Looncode 591 (Maaltijdcheques)" value={form.looncode_591} onChange={set("looncode_591")} listId="dl-591" options={uniq("looncode_591")} />
              <DatalistField label="Looncode 691 (Werkgeversbijdr. MC)" value={form.looncode_691} onChange={set("looncode_691")} listId="dl-691" options={uniq("looncode_691")} />
              <DatalistField label="Looncode 104 (Nachtploeg)" value={form.looncode_104} onChange={set("looncode_104")} listId="dl-104" options={uniq("looncode_104")} />
            </div>
          )}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <DatalistField label="Sturingsgroep" value={form.sturingsgroep} onChange={set("sturingsgroep")} listId="dl-sg" options={uniq("sturingsgroep")} />
              <DatalistField label="Kostenplaats" value={form.kostenplaats} onChange={set("kostenplaats")} listId="dl-kp" options={uniq("kostenplaats")} />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => step > 0 ? setStep((s) => s - 1) : handleClose()} disabled={saving}>
            {step === 0 ? "Annuleren" : "Vorige"}
          </Button>
          <Button onClick={handleNext} disabled={saving || (step === 0 && !form.voornaam.trim())}>
            {saving ? "Opslaan..." : isLastStep ? "Voltooien" : "Volgende & Opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}