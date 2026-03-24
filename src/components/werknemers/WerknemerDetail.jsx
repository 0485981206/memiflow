import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Pencil } from "lucide-react";

const Field = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">{title}</h3>
    <div className="bg-card rounded-lg border px-3">{children}</div>
  </div>
);

const statusColors = {
  actief: "bg-chart-5/10 text-chart-5",
  inactief: "bg-muted text-muted-foreground",
  ziekteverlof: "bg-chart-4/10 text-chart-4",
};

export default function WerknemerDetail({ werknemer, onClose, onEdit }) {
  if (!werknemer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background border-l shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="font-semibold text-base">{werknemer.Voornaam || werknemer.voornaam} {werknemer.familienaam || werknemer.achternaam}</h2>
            <p className="text-xs text-muted-foreground">{werknemer.Functie || werknemer.functie}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[werknemer.status] || "bg-muted"} variant="secondary">
              {werknemer.status || "actief"}
            </Badge>
            <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="px-4 pb-8">
          <Section title="Identificatie">
            <Field label="Overeenkomstnummer" value={werknemer["overeenkomstnummer"] || werknemer["\uFEFFovereenkomstnummer"]} />
            <Field label="Rijksregisternummer" value={werknemer["Rijksregisternummer"] || werknemer.rijksregisternummer} />
            <Field label="Geboortedatum" value={werknemer["Geboortedatum"] || werknemer.geboortedatum} />
            <Field label="Geslacht" value={werknemer["Geslacht"] || werknemer.geslacht} />
            <Field label="Nationaliteit" value={werknemer["Nationaliteit"] || werknemer.nationaliteit} />
            <Field label="Officiële taal" value={werknemer["Officiële taal"] || werknemer.officiele_taal} />
          </Section>

          <Section title="Adres">
            <Field label="Straat + nr" value={[werknemer["Straat"] || werknemer.straat, werknemer["Huisnummer"] || werknemer.huisnummer].filter(Boolean).join(" ")} />
            <Field label="Postcode + Gemeente" value={[werknemer["Postcode"] || werknemer.postcode, werknemer["Gemeente"] || werknemer.gemeente].filter(Boolean).join(" ")} />
            <Field label="Land" value={werknemer["Land"] || werknemer.land} />
            <Field label="Adres (samengevoegd)" value={werknemer.adres} />
          </Section>

          <Section title="Persoonlijk">
            <Field label="Burgerlijke staat" value={werknemer["Burgerlijke staat"] || werknemer.burgerlijke_staat} />
            <Field label="Aantal kinderen ten laste" value={werknemer["Aantal kinderen ten laste"] || werknemer.aantal_kinderen_ten_laste} />
            <Field label="Personen 65+ ten laste" value={werknemer["Personen 65+ ten laste"] || werknemer.personen_65_plus_ten_laste} />
            <Field label="Persoon met handicap" value={werknemer["Persoon met handicap"] || werknemer.persoon_met_handicap} />
          </Section>

          <Section title="Tewerkstelling">
            <Field label="Datum in dienst" value={werknemer["Datum in dienst"] || werknemer.startdatum} />
            <Field label="Type overeenkomst" value={werknemer["Type overeenkomst"] || werknemer.type_overeenkomst} />
            <Field label="Werknemerstypering" value={werknemer["Werknemerstypering"] || werknemer.werknemerstypering} />
            <Field label="Paritair Comité" value={werknemer["Paritair Comité"] || werknemer.paritair_comite} />
            <Field label="Functie" value={werknemer["Functie"] || werknemer.functie} />
            <Field label="Type werktijd" value={werknemer["Type werktijd"] || werknemer.type_werktijd} />
            <Field label="Werkregime" value={werknemer["Werkregime"] || werknemer.werkregime} />
            <Field label="Tewerkstellingsbreuk" value={werknemer["Tewerkstellingsbreuk"] || werknemer.tewerkstellingsbreuk} />
            <Field label="Berekeningswijze" value={werknemer["Berekeningswijze"] || werknemer.berekeningswijze} />
          </Section>

          <Section title="Barema & Loon">
            <Field label="Barema type" value={werknemer["Barema type"] || werknemer.barema_type} />
            <Field label="Barema code" value={werknemer["Barema code"] || werknemer.barema_code} />
            <Field label="Uurloon (€)" value={werknemer.uurloon} />
            <Field label="Looncode 411 (Kledij)" value={werknemer["Looncode 411 (Kledij)"] || werknemer.looncode_411} />
            <Field label="Looncode 591 (Maaltijdcheques)" value={werknemer["Looncode 591 (Maaltijdcheques)"] || werknemer.looncode_591} />
            <Field label="Looncode 691 (Werkgeversbijdr. MC)" value={werknemer["Looncode 691 (Werkgeversbijdr. MC)"] || werknemer.looncode_691} />
            <Field label="Looncode 104 (Nachtploeg)" value={werknemer["Looncode 104 (nachtploeg)"] || werknemer.looncode_104} />
          </Section>

          <Section title="Organisatie">
            <Field label="Sturingsgroep" value={werknemer["Sturingsgroep"] || werknemer.sturingsgroep} />
            <Field label="Kostenplaats" value={werknemer["Kostenplaats"] || werknemer.kostenplaats} />
          </Section>

          <Section title="Contact">
            <Field label="E-mail" value={werknemer.email} />
            <Field label="Telefoon" value={werknemer.telefoon} />
          </Section>
        </div>
      </div>
    </div>
  );
}