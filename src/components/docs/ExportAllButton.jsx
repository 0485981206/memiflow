import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const ENTITIES = [
  "Werknemer", "Eindklant", "Werkspot", "Plaatsing", "Prestatie",
  "PrestatieCode", "PrestatieImportBatch", "PrestatieConceptRegel",
  "AcertaCode", "FinancieelRapport", "Klokregistratie", "TijdelijkeWerknemer", "Afwijking"
];

// All documentation content as functions to avoid circular imports
function getSchemaSQL() {
  return `-- VOLLEDIGE DATABASE SCHEMA
-- Gegenereerd: ${new Date().toISOString()}

CREATE TABLE werknemer (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, voornaam TEXT NOT NULL, achternaam TEXT NOT NULL, alias TEXT, overeenkomstnummer TEXT, externe_id TEXT, email TEXT, telefoon TEXT, contactnummer TEXT, noodcontact TEXT, functie TEXT, status TEXT DEFAULT 'actief', location_status TEXT DEFAULT 'actief', startdatum DATE, einddatum DATE, uurloon NUMERIC, rijksregisternummer TEXT, adres TEXT, geboortedatum DATE, geslacht TEXT, nationaliteit TEXT, officiele_taal TEXT, land TEXT, burgerlijke_staat TEXT, aantal_kinderen_ten_laste TEXT, personen_65_plus_ten_laste TEXT, persoon_met_handicap TEXT, type_overeenkomst TEXT, werknemerstypering TEXT, paritair_comite TEXT, type_werktijd TEXT, werkregime TEXT, tewerkstellingsbreuk TEXT, berekeningswijze TEXT, barema_type TEXT, barema_code TEXT, looncode_411 TEXT, looncode_591 TEXT, looncode_691 TEXT, looncode_104 TEXT, sturingsgroep TEXT, kostenplaats TEXT, ploeg_type TEXT DEFAULT 'dagploeg', dagploeg_uren_mado NUMERIC DEFAULT 8, nachtploeg_uren_mado NUMERIC DEFAULT 0, dagploeg_uren_vr NUMERIC DEFAULT 6, nachtploeg_uren_vr NUMERIC DEFAULT 0, nfc_id TEXT UNIQUE);
CREATE TABLE eindklant (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, naam TEXT NOT NULL, contactpersoon TEXT, email TEXT, telefoon TEXT, adres TEXT, btw_nummer TEXT, status TEXT DEFAULT 'actief', facturatie_tarief NUMERIC, prestatie_pdf_url TEXT, prestatie_pdf_naam TEXT, pdf_instructies TEXT, pincode TEXT);
CREATE TABLE werkspot (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, naam TEXT NOT NULL, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, beschrijving TEXT, toegewezen_werknemers TEXT, status TEXT DEFAULT 'actief', auto_checkin BOOLEAN DEFAULT FALSE, is_gepauzeerd BOOLEAN DEFAULT FALSE, pauze_reden TEXT, pauze_start TEXT);
CREATE TABLE plaatsing (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, startdatum DATE, einddatum DATE, functie TEXT, uurrooster TEXT, status TEXT DEFAULT 'actief', tarief NUMERIC);
CREATE TABLE prestatie (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, plaatsing_id TEXT REFERENCES plaatsing(id), datum DATE NOT NULL, dag TEXT, code TEXT, uren NUMERIC, totaal_uren NUMERIC, bron TEXT, externe_id TEXT, firma TEXT, dagschema TEXT, in_1 TEXT, uit_1 TEXT, in_2 TEXT, uit_2 TEXT, in_3 TEXT, uit_3 TEXT, in_4 TEXT, uit_4 TEXT, in_5 TEXT, uit_5 TEXT, in_6 TEXT, uit_6 TEXT, opmerking TEXT, status TEXT DEFAULT 'ingevoerd', maand TEXT);
CREATE TABLE prestatiecode (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, code TEXT NOT NULL, naam TEXT NOT NULL, kleur TEXT, type TEXT, standaard_uren NUMERIC);
CREATE TABLE prestatieimportbatch (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, bestandsnaam TEXT NOT NULL, bestand_url TEXT, eindklant_naam TEXT, status TEXT DEFAULT 'verwerken', conversation_id TEXT, agent_samenvatting TEXT, prestatie_ids TEXT, aantal_prestaties NUMERIC, aantal_goedgekeurd NUMERIC);
CREATE TABLE prestatieconceptregel (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, batch_id TEXT REFERENCES prestatieimportbatch(id), werknemer_naam TEXT NOT NULL, werknemer_id TEXT REFERENCES werknemer(id), datum DATE NOT NULL, dag TEXT, uren NUMERIC NOT NULL, code TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, plaatsing_id TEXT REFERENCES plaatsing(id), status TEXT DEFAULT 'concept', opmerking TEXT, werknemer_niet_gevonden BOOLEAN DEFAULT FALSE, bron TEXT, externe_id TEXT, firma TEXT, dagschema TEXT, in_1 TEXT, uit_1 TEXT, in_2 TEXT, uit_2 TEXT, in_3 TEXT, uit_3 TEXT, in_4 TEXT, uit_4 TEXT, in_5 TEXT, uit_5 TEXT, in_6 TEXT, uit_6 TEXT);
CREATE TABLE acertacode (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, datum DATE NOT NULL, maand TEXT, code TEXT NOT NULL, code_naam TEXT, uren NUMERIC NOT NULL, totaal_gewerkte_uren NUMERIC, dagmax NUMERIC, is_overuren BOOLEAN DEFAULT FALSE, is_tekort BOOLEAN DEFAULT FALSE, ploeg_type TEXT, bron_prestatie_id TEXT REFERENCES prestatie(id), status TEXT DEFAULT 'berekend');
CREATE TABLE financieelrapport (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, maand TEXT NOT NULL, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, totaal_uren NUMERIC, overuren NUMERIC, tekort_uren NUMERIC, facturatie_tarief NUMERIC, uurloon NUMERIC, omzet NUMERIC, loonkost NUMERIC, marge NUMERIC, marge_percentage NUMERIC, werkdagen NUMERIC, feestdagen NUMERIC, ziektedagen NUMERIC, status TEXT DEFAULT 'berekend');
CREATE TABLE klokregistratie (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, datum DATE NOT NULL, start_tijd TEXT NOT NULL, stop_tijd TEXT, status TEXT DEFAULT 'gestart', prestatie_id TEXT REFERENCES prestatie(id));
CREATE TABLE tijdelijkewerknemer (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, voornaam TEXT NOT NULL, achternaam TEXT NOT NULL, alias TEXT, telefoon TEXT, opmerking TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, datum DATE, start_tijd TEXT, stop_tijd TEXT, status TEXT DEFAULT 'nieuw', gekoppeld_werknemer_id TEXT REFERENCES werknemer(id), gekoppeld_werknemer_naam TEXT, aangemaakt_door TEXT);
CREATE TABLE afwijking (id TEXT PRIMARY KEY, created_date TEXT, updated_date TEXT, created_by TEXT, werknemer_id TEXT REFERENCES werknemer(id), werknemer_naam TEXT, eindklant_id TEXT REFERENCES eindklant(id), eindklant_naam TEXT, werkspot_id TEXT REFERENCES werkspot(id), werkspot_naam TEXT, datum DATE NOT NULL, reden TEXT NOT NULL, stop_tijd TEXT, status TEXT DEFAULT 'open');`;
}

function getRelationsText() {
  return `# TABEL RELATIES & FOREIGN KEYS

| Parent Tabel | Child Tabel | Foreign Key | Type | Beschrijving |
|---|---|---|---|---|
| Eindklant | Werkspot | eindklant_id | 1:N | Een eindklant kan meerdere werkspots hebben |
| Eindklant | Plaatsing | eindklant_id | 1:N | Een eindklant kan meerdere plaatsingen hebben |
| Eindklant | Prestatie | eindklant_id | 1:N | Prestaties worden per eindklant geregistreerd |
| Eindklant | Klokregistratie | eindklant_id | 1:N | Klokregistraties zijn per eindklant |
| Eindklant | TijdelijkeWerknemer | eindklant_id | 1:N | Tijdelijke werknemers worden per eindklant aangemaakt |
| Eindklant | Afwijking | eindklant_id | 1:N | Afwijkingen worden per eindklant geregistreerd |
| Eindklant | AcertaCode | eindklant_id | 1:N | Acerta codes per eindklant |
| Eindklant | FinancieelRapport | eindklant_id | 1:N | Financiële rapporten per eindklant |
| Werknemer | Plaatsing | werknemer_id | 1:N | Een werknemer kan meerdere plaatsingen hebben |
| Werknemer | Prestatie | werknemer_id | 1:N | Prestaties worden per werknemer geregistreerd |
| Werknemer | Klokregistratie | werknemer_id | 1:N | Klokregistraties per werknemer |
| Werknemer | AcertaCode | werknemer_id | 1:N | Acerta codes per werknemer |
| Werknemer | FinancieelRapport | werknemer_id | 1:N | Financiële rapporten per werknemer |
| Werknemer | Afwijking | werknemer_id | 1:N | Afwijkingen per werknemer |
| Werknemer | TijdelijkeWerknemer | gekoppeld_werknemer_id | 1:N | Tijdelijke werknemers kunnen gekoppeld worden aan vaste werknemers |
| Plaatsing | Prestatie | plaatsing_id | 1:N | Prestaties worden aan een plaatsing gekoppeld |
| Plaatsing | PrestatieConceptRegel | plaatsing_id | 1:N | Concept regels worden aan een plaatsing gekoppeld |
| Prestatie | Klokregistratie | prestatie_id | 1:1 | Een klokregistratie wordt aan een prestatie gekoppeld na stop |
| Prestatie | AcertaCode | bron_prestatie_id | 1:N | Acerta codes worden berekend vanuit prestaties |
| PrestatieImportBatch | PrestatieConceptRegel | batch_id | 1:N | Concept regels horen bij een import batch |
| Werkspot | Afwijking | werkspot_id | 1:N | Afwijkingen kunnen aan een werkspot gekoppeld zijn |
| Werkspot | Werknemer | toegewezen_werknemers (array) | N:M | Werkspots bevatten een array van werknemer IDs |`;
}

function getPermissionsText() {
  return `# TOEGANGSCONTROLE & PERMISSIES

## Gebruikersrollen
- admin: Volledige CRUD op alle entities, gebruikers uitnodigen, backup triggeren, CSV exports, toegang tot alle pagina's
- user: Lees-toegang tot eigen records, beperkte schrijfrechten, kan alleen eigen profiel bewerken

## Tabel toegang
| Tabel | Admin | User | Opmerking |
|---|---|---|---|
| User | CRUD | Alleen eigen profiel | Built-in entity met speciale RLS |
| Werknemer | CRUD | CRUD | Basis data werknemers |
| Eindklant | CRUD | CRUD | Klantgegevens |
| Werkspot | CRUD | CRUD | Via location backend functions |
| Plaatsing | CRUD | Lezen | Koppeling werknemer ↔ klant |
| Prestatie | CRUD | Lezen | Prestatieregistraties |
| PrestatieCode | CRUD | Lezen | Prestatiecodes configuratie |
| PrestatieImportBatch | CRUD | Lezen | PDF import batches |
| PrestatieConceptRegel | CRUD | Lezen | Concept regels uit imports |
| AcertaCode | CRUD | Lezen | Berekende Acerta loonlijnen |
| FinancieelRapport | CRUD | Lezen | Financiële maandrapporten |
| Klokregistratie | CRUD | CRUD | Via location backend functions |
| TijdelijkeWerknemer | CRUD | CRUD | Via location backend functions |
| Afwijking | CRUD | CRUD | Via location backend functions |

## Publieke routes (geen login vereist)
- /location — Klokregistratie interface voor teamleaders (pincode-login)
- /nfc — NFC badge check-in pagina

## Admin-only backend functions
backupToSupabase, exportCsv, berekenAcertaCodes, berekenFinancieelRapport, autoCheckin, importPlaatsingen`;
}

function getEnumsText() {
  return `# ENUMS, DROPDOWNS & STATUS VELDEN

## Werknemer
- status: actief (default), inactief, ziekteverlof
- location_status: actief (default), inactief
- ploeg_type: dagploeg (default), dag_nacht

## Eindklant
- status: actief (default), inactief

## Werkspot
- status: actief (default), inactief

## Plaatsing
- status: actief (default), beeindigd, gepland

## Prestatie
- status: ingevoerd (default), goedgekeurd, afgekeurd
- code: R (Regulier), O (Overuren), N (Nacht), Z (Ziekte), V (Verlof), ...custom codes

## PrestatieCode
- type: werk, afwezigheid, overig

## PrestatieImportBatch
- status: verwerken (default), klaar_voor_review, goedgekeurd, fout

## PrestatieConceptRegel
- status: concept (default), goedgekeurd, afgekeurd

## AcertaCode
- status: berekend (default), handmatig_aangepast, goedgekeurd
- ploeg_type: dagploeg, nachtploeg
- code: 100 (Gewone prestaties), 4003 (Overuren 150%), 428 (Tekort), 220 (Feestdag), 230 (Verlof), 104 (Nachtploeg)

## FinancieelRapport
- status: berekend (default), handmatig_aangepast, goedgekeurd

## Klokregistratie
- status: gestart (default), gestopt

## TijdelijkeWerknemer
- status: nieuw (default), ingecheckt, uitgecheckt, gekoppeld

## Afwijking
- status: open (default), behandeld

## User
- role: admin, user (default)`;
}

function getNavigatieText() {
  return `# MENU & NAVIGATIE DOCUMENTATIE

## Overzicht
- Dashboard (/) — Hoofdoverzicht met KPI-kaarten, weekelijks uren grafiek, top klanten/werknemers, status panel, bronverdeling en maandtrend.
- Workspaces (/workspace) — Visueel overzicht van gepersonaliseerde workspaces.

## Klanten
- Overzicht (/eindklanten) — Lijst van alle eindklanten met contactgegevens, BTW-nummer, facturatietarief en status.
- Pincodes (/klant-pincodes) — Beheer van 6-cijferige pincodes per eindklant voor teamleader login.
- Tijdelijke werknemers (/tijdelijke-werknemers) — Overzicht van tijdelijke werknemers aangemaakt op locatie.
- NFC Badges (/nfc-badges) — Beheer NFC badge IDs per werknemer.
- Afwijkingen (/afwijkingen) — Overzicht van gemelde afwijkingen per werknemer en werkspot.

## Finance
- Finance Dashboard (/finance) — Financieel overzicht met omzet, loonkost en marge.

## Prestaties
- Kalender (/prestaties/kalender) — Kalenderweergave per werknemer met inline bewerking.
- Kalenderoverzicht (/prestaties/kalenderoverzicht) — Maandoverzicht van alle werknemers.
- Overzicht (/prestaties/overzicht) — Tabeloverzicht met filters en bulk goedkeuring.
- Records (/prestaties/records) — Ruwe klokregistraties met inline bewerking.

## Acerta
- Acerta Kalender (/acerta/kalender) — Kalenderweergave van berekende Acerta looncodes.

## Beheer
- Loonfiches (/loonfiches) — Beheer en generatie van loonfiches.
- Rapporten (/rapporten) — Maandelijkse rapportage.

## Instellingen
- Algemeen (/instellingen) — App-instellingen en configuratie.
- Werknemers (/werknemers) — Volledige werknemersdatabase.
- Plaatsingen (/plaatsingen) — Koppeling werknemer ↔ eindklant.
- Werkspots (/werkspots) — Werkplekken per eindklant.
- Codes (/prestaties/codes) — Prestatiecodes configuratie.
- PDF Import (/prestaties/import) — Upload en AI-verwerking van prestatie-PDF's.

## Publieke pagina's
- Location (/location) — Klokregistratie-interface voor teamleaders (pincode-login).
- NFC Check-in (/nfc) — Automatische check-in via NFC badge scan.

## Belangrijke knoppen
| Locatie | Knop | Beschrijving |
|---|---|---|
| Location → Werkspots | Check-in | Start klokregistratie voor alle werknemers in werkspot |
| Location → Werkspots | Check-out | Stop klokregistratie + maakt Prestatie record |
| Location → Werkspots | Pauze | Pauzeert werkspot met reden |
| Location → Werkspots | Hervatten | Hervat gepauzeerde werkspot |
| Location → Werkspots | Afwijking (⚠️) | Meldt afwijking voor werknemer |
| Location → Werkspots | Auto check-in | Dagelijkse auto check-in om 08:00 |
| Location → Werkspots | Toewijzen | Wijst werknemers toe aan werkspot |
| Location → Werknemers | Start / Stop | Individuele klokregistratie |
| Prestaties → Import | Upload PDF | AI-verwerking van prestatie-PDF |
| Prestaties → Import | Goedkeuren | Keurt conceptregels goed |
| Werknemers | Importeren | Bulk import via CSV/Excel |
| Acerta | Herberekenen | Herberekent Acerta looncodes |`;
}

export default function ExportAllButton() {
  const [loading, setLoading] = useState(false);

  const handleExportAll = async () => {
    setLoading(true);

    // Fetch all CSV data
    const csvRes = await base44.functions.invoke("exportCsv", {});
    const csvData = csvRes.data;

    // Build the full export document
    let doc = `================================================================
HR.iQ - VOLLEDIGE DATABASE DOCUMENTATIE & EXPORT
Gegenereerd: ${new Date().toISOString()}
================================================================

`;

    // 1. Navigation & UI docs
    doc += `\n${"=".repeat(60)}\n1. MENU & NAVIGATIE DOCUMENTATIE\n${"=".repeat(60)}\n\n`;
    doc += getNavigatieText();

    // 2. Schema SQL
    doc += `\n\n${"=".repeat(60)}\n2. DATABASE SCHEMA (SQL)\n${"=".repeat(60)}\n\n`;
    doc += getSchemaSQL();

    // 3. Relations
    doc += `\n\n${"=".repeat(60)}\n3. TABEL RELATIES\n${"=".repeat(60)}\n\n`;
    doc += getRelationsText();

    // 4. Permissions
    doc += `\n\n${"=".repeat(60)}\n4. PERMISSIES & TOEGANGSCONTROLE\n${"=".repeat(60)}\n\n`;
    doc += getPermissionsText();

    // 5. Enums
    doc += `\n\n${"=".repeat(60)}\n5. ENUMS & STATUS VELDEN\n${"=".repeat(60)}\n\n`;
    doc += getEnumsText();

    // 6. CSV data per entity
    doc += `\n\n${"=".repeat(60)}\n6. DATA EXPORT (CSV PER ENTITY)\n${"=".repeat(60)}\n`;

    for (const entity of ENTITIES) {
      const entityData = csvData[entity];
      if (entityData) {
        doc += `\n--- ${entity} (${entityData.count} records) ---\n`;
        doc += entityData.csv || "(geen data)";
        doc += "\n";
      }
    }

    // Download as .txt
    const blob = new Blob([doc], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRIQ_database_export_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(false);
  };

  return (
    <Button onClick={handleExportAll} disabled={loading} variant="default" className="gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? "Exporteren..." : "Exporteer alles (.txt)"}
    </Button>
  );
}