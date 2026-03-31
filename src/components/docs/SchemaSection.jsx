import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const SQL_SCHEMA = `-- =============================================
-- VOLLEDIGE DATABASE SCHEMA - Gegenereerd op ${new Date().toISOString().split('T')[0]}
-- =============================================

-- Werknemer (272 records)
CREATE TABLE IF NOT EXISTS werknemer (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  voornaam TEXT NOT NULL, achternaam TEXT NOT NULL, alias TEXT,
  overeenkomstnummer TEXT, externe_id TEXT, email TEXT, telefoon TEXT,
  contactnummer TEXT, noodcontact TEXT, functie TEXT,
  status TEXT DEFAULT 'actief' CHECK (status IN ('actief','inactief','ziekteverlof')),
  location_status TEXT DEFAULT 'actief' CHECK (location_status IN ('actief','inactief')),
  startdatum DATE, einddatum DATE, uurloon NUMERIC,
  rijksregisternummer TEXT, adres TEXT, geboortedatum DATE, geslacht TEXT,
  nationaliteit TEXT, officiele_taal TEXT, land TEXT, burgerlijke_staat TEXT,
  aantal_kinderen_ten_laste TEXT, personen_65_plus_ten_laste TEXT,
  persoon_met_handicap TEXT, type_overeenkomst TEXT, werknemerstypering TEXT,
  paritair_comite TEXT, type_werktijd TEXT, werkregime TEXT,
  tewerkstellingsbreuk TEXT, berekeningswijze TEXT, barema_type TEXT, barema_code TEXT,
  looncode_411 TEXT, looncode_591 TEXT, looncode_691 TEXT, looncode_104 TEXT,
  sturingsgroep TEXT, kostenplaats TEXT,
  ploeg_type TEXT DEFAULT 'dagploeg' CHECK (ploeg_type IN ('dagploeg','dag_nacht')),
  dagploeg_uren_mado NUMERIC DEFAULT 8, nachtploeg_uren_mado NUMERIC DEFAULT 0,
  dagploeg_uren_vr NUMERIC DEFAULT 6, nachtploeg_uren_vr NUMERIC DEFAULT 0,
  nfc_id TEXT UNIQUE
);

-- Eindklant (20 records)
CREATE TABLE IF NOT EXISTS eindklant (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  naam TEXT NOT NULL, contactpersoon TEXT, email TEXT, telefoon TEXT,
  adres TEXT, btw_nummer TEXT,
  status TEXT DEFAULT 'actief' CHECK (status IN ('actief','inactief')),
  facturatie_tarief NUMERIC,
  prestatie_pdf_url TEXT, prestatie_pdf_naam TEXT, pdf_instructies TEXT, pincode TEXT
);

-- Werkspot (4 records)
CREATE TABLE IF NOT EXISTS werkspot (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  naam TEXT NOT NULL,
  eindklant_id TEXT NOT NULL REFERENCES eindklant(id),
  eindklant_naam TEXT, beschrijving TEXT, toegewezen_werknemers TEXT,
  status TEXT DEFAULT 'actief' CHECK (status IN ('actief','inactief')),
  auto_checkin BOOLEAN DEFAULT FALSE,
  is_gepauzeerd BOOLEAN DEFAULT FALSE,
  pauze_reden TEXT, pauze_start TEXT
);

-- Plaatsing (261 records)
CREATE TABLE IF NOT EXISTS plaatsing (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT,
  eindklant_id TEXT NOT NULL REFERENCES eindklant(id),
  eindklant_naam TEXT,
  startdatum DATE, einddatum DATE, functie TEXT, uurrooster TEXT,
  status TEXT DEFAULT 'actief' CHECK (status IN ('actief','beeindigd','gepland')),
  tarief NUMERIC
);

-- Prestatie (268 records)
CREATE TABLE IF NOT EXISTS prestatie (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT,
  eindklant_id TEXT REFERENCES eindklant(id),
  eindklant_naam TEXT, plaatsing_id TEXT REFERENCES plaatsing(id),
  datum DATE NOT NULL, dag TEXT, code TEXT, uren NUMERIC, totaal_uren NUMERIC,
  bron TEXT, externe_id TEXT, firma TEXT, dagschema TEXT,
  in_1 TEXT, uit_1 TEXT, in_2 TEXT, uit_2 TEXT, in_3 TEXT, uit_3 TEXT,
  in_4 TEXT, uit_4 TEXT, in_5 TEXT, uit_5 TEXT, in_6 TEXT, uit_6 TEXT,
  opmerking TEXT,
  status TEXT DEFAULT 'ingevoerd' CHECK (status IN ('ingevoerd','goedgekeurd','afgekeurd')),
  maand TEXT
);

-- PrestatieCode (13 records)
CREATE TABLE IF NOT EXISTS prestatiecode (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  code TEXT NOT NULL, naam TEXT NOT NULL, kleur TEXT,
  type TEXT CHECK (type IN ('werk','afwezigheid','overig')),
  standaard_uren NUMERIC
);

-- PrestatieImportBatch (2 records)
CREATE TABLE IF NOT EXISTS prestatieimportbatch (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  bestandsnaam TEXT NOT NULL, bestand_url TEXT, eindklant_naam TEXT,
  status TEXT DEFAULT 'verwerken' CHECK (status IN ('verwerken','klaar_voor_review','goedgekeurd','fout')),
  conversation_id TEXT, agent_samenvatting TEXT, prestatie_ids TEXT,
  aantal_prestaties NUMERIC, aantal_goedgekeurd NUMERIC
);

-- PrestatieConceptRegel (180 records)
CREATE TABLE IF NOT EXISTS prestatieconceptregel (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  batch_id TEXT NOT NULL REFERENCES prestatieimportbatch(id),
  werknemer_naam TEXT NOT NULL, werknemer_id TEXT REFERENCES werknemer(id),
  datum DATE NOT NULL, dag TEXT, uren NUMERIC NOT NULL, code TEXT,
  eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT,
  plaatsing_id TEXT REFERENCES plaatsing(id),
  status TEXT DEFAULT 'concept' CHECK (status IN ('concept','goedgekeurd','afgekeurd')),
  opmerking TEXT, werknemer_niet_gevonden BOOLEAN DEFAULT FALSE,
  bron TEXT, externe_id TEXT, firma TEXT, dagschema TEXT,
  in_1 TEXT, uit_1 TEXT, in_2 TEXT, uit_2 TEXT, in_3 TEXT, uit_3 TEXT,
  in_4 TEXT, uit_4 TEXT, in_5 TEXT, uit_5 TEXT, in_6 TEXT, uit_6 TEXT
);

-- AcertaCode (174 records)
CREATE TABLE IF NOT EXISTS acertacode (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id),
  eindklant_naam TEXT,
  datum DATE NOT NULL, maand TEXT, code TEXT NOT NULL, code_naam TEXT,
  uren NUMERIC NOT NULL, totaal_gewerkte_uren NUMERIC, dagmax NUMERIC,
  is_overuren BOOLEAN DEFAULT FALSE, is_tekort BOOLEAN DEFAULT FALSE,
  ploeg_type TEXT CHECK (ploeg_type IN ('dagploeg','nachtploeg')),
  bron_prestatie_id TEXT REFERENCES prestatie(id),
  status TEXT DEFAULT 'berekend' CHECK (status IN ('berekend','handmatig_aangepast','goedgekeurd'))
);

-- FinancieelRapport (0 records)
CREATE TABLE IF NOT EXISTS financieelrapport (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  maand TEXT NOT NULL, werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT,
  totaal_uren NUMERIC, overuren NUMERIC, tekort_uren NUMERIC,
  facturatie_tarief NUMERIC, uurloon NUMERIC, omzet NUMERIC, loonkost NUMERIC,
  marge NUMERIC, marge_percentage NUMERIC, werkdagen NUMERIC, feestdagen NUMERIC,
  ziektedagen NUMERIC,
  status TEXT DEFAULT 'berekend' CHECK (status IN ('berekend','handmatig_aangepast','goedgekeurd'))
);

-- Klokregistratie (157 records)
CREATE TABLE IF NOT EXISTS klokregistratie (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT,
  eindklant_id TEXT NOT NULL REFERENCES eindklant(id),
  eindklant_naam TEXT,
  datum DATE NOT NULL, start_tijd TEXT NOT NULL, stop_tijd TEXT,
  status TEXT DEFAULT 'gestart' CHECK (status IN ('gestart','gestopt')),
  prestatie_id TEXT REFERENCES prestatie(id)
);

-- TijdelijkeWerknemer (4 records)
CREATE TABLE IF NOT EXISTS tijdelijkewerknemer (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  voornaam TEXT NOT NULL, achternaam TEXT NOT NULL, alias TEXT,
  telefoon TEXT, opmerking TEXT,
  eindklant_id TEXT NOT NULL REFERENCES eindklant(id),
  eindklant_naam TEXT, datum DATE, start_tijd TEXT, stop_tijd TEXT,
  status TEXT DEFAULT 'nieuw' CHECK (status IN ('nieuw','ingecheckt','uitgecheckt','gekoppeld')),
  gekoppeld_werknemer_id TEXT REFERENCES werknemer(id),
  gekoppeld_werknemer_naam TEXT, aangemaakt_door TEXT
);

-- Afwijking (2 records)
CREATE TABLE IF NOT EXISTS afwijking (
  id TEXT PRIMARY KEY,
  created_date TEXT, updated_date TEXT, created_by TEXT,
  werknemer_id TEXT NOT NULL REFERENCES werknemer(id),
  werknemer_naam TEXT,
  eindklant_id TEXT NOT NULL REFERENCES eindklant(id),
  eindklant_naam TEXT,
  werkspot_id TEXT REFERENCES werkspot(id), werkspot_naam TEXT,
  datum DATE NOT NULL, reden TEXT NOT NULL, stop_tijd TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','behandeld'))
);

-- =============================================
-- INDEXES voor performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_werknemer_status ON werknemer(status);
CREATE INDEX IF NOT EXISTS idx_werknemer_externe_id ON werknemer(externe_id);
CREATE INDEX IF NOT EXISTS idx_plaatsing_werknemer ON plaatsing(werknemer_id);
CREATE INDEX IF NOT EXISTS idx_plaatsing_eindklant ON plaatsing(eindklant_id);
CREATE INDEX IF NOT EXISTS idx_prestatie_werknemer ON prestatie(werknemer_id);
CREATE INDEX IF NOT EXISTS idx_prestatie_datum ON prestatie(datum);
CREATE INDEX IF NOT EXISTS idx_prestatie_maand ON prestatie(maand);
CREATE INDEX IF NOT EXISTS idx_klokregistratie_werknemer ON klokregistratie(werknemer_id);
CREATE INDEX IF NOT EXISTS idx_klokregistratie_datum ON klokregistratie(datum);
CREATE INDEX IF NOT EXISTS idx_klokregistratie_eindklant ON klokregistratie(eindklant_id);
CREATE INDEX IF NOT EXISTS idx_acertacode_werknemer ON acertacode(werknemer_id);
CREATE INDEX IF NOT EXISTS idx_acertacode_datum ON acertacode(datum);
CREATE INDEX IF NOT EXISTS idx_acertacode_maand ON acertacode(maand);
CREATE INDEX IF NOT EXISTS idx_conceptregel_batch ON prestatieconceptregel(batch_id);
CREATE INDEX IF NOT EXISTS idx_afwijking_datum ON afwijking(datum);
CREATE INDEX IF NOT EXISTS idx_werkspot_eindklant ON werkspot(eindklant_id);
CREATE INDEX IF NOT EXISTS idx_financieel_maand ON financieelrapport(maand);
CREATE INDEX IF NOT EXISTS idx_tijdelijk_eindklant ON tijdelijkewerknemer(eindklant_id);`;

export default function SchemaSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Database Schema (SQL)</CardTitle>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? "Gekopieerd!" : "Kopieer SQL"}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[70vh] text-xs font-mono whitespace-pre">
          {SQL_SCHEMA}
        </pre>
      </CardContent>
    </Card>
  );
}