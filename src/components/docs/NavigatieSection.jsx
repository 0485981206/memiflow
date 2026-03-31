import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    categorie: "Overzicht",
    items: [
      { naam: "Dashboard", pad: "/", beschrijving: "Hoofdoverzicht met KPI-kaarten, weekelijks uren grafiek, top klanten/werknemers, status panel, bronverdeling en maandtrend." },
      { naam: "Workspaces", pad: "/workspace", beschrijving: "Visueel overzicht van gepersonaliseerde workspaces. Elke workspace groepeert relevante data en snelkoppelingen." },
    ],
  },
  {
    categorie: "Klanten",
    items: [
      { naam: "Overzicht (Eindklanten)", pad: "/eindklanten", beschrijving: "Lijst van alle eindklanten met contactgegevens, BTW-nummer, facturatietarief en status. Hier kan je klanten toevoegen, bewerken en inactiveren." },
      { naam: "Pincodes", pad: "/klant-pincodes", beschrijving: "Beheer van 6-cijferige pincodes per eindklant. Teamleaders gebruiken deze pincode om in te loggen op de /location klokregistratie-interface." },
      { naam: "Tijdelijke werknemers", pad: "/tijdelijke-werknemers", beschrijving: "Overzicht van alle tijdelijke werknemers die door teamleaders zijn aangemaakt op de locatie-interface. Inclusief koppeling aan vaste werknemers." },
      { naam: "NFC Badges", pad: "/nfc-badges", beschrijving: "Beheer NFC badge IDs per werknemer. NFC badges worden gebruikt voor automatische check-in via de /nfc pagina." },
      { naam: "Afwijkingen", pad: "/afwijkingen", beschrijving: "Overzicht van alle gemelde afwijkingen (te laat, ziek, materiaal defect, etc.) per werknemer en werkspot met status (open/behandeld)." },
    ],
  },
  {
    categorie: "Finance",
    items: [
      { naam: "Finance Dashboard", pad: "/finance", beschrijving: "Financieel overzicht met omzet per klant, omzet per werknemer, omzettrend en KPI-kaarten (totale omzet, loonkost, marge)." },
    ],
  },
  {
    categorie: "Prestaties",
    items: [
      { naam: "Kalender", pad: "/prestaties/kalender", beschrijving: "Kalenderweergave per werknemer. Toont prestaties per dag met kleurcodering per prestatiecode. Inline bewerken van uren en codes." },
      { naam: "Kalenderoverzicht", pad: "/prestaties/kalenderoverzicht", beschrijving: "Maandoverzicht van alle werknemers in één tabel. Snel scannen van wie wanneer gewerkt heeft, met totalen per werknemer." },
      { naam: "Overzicht", pad: "/prestaties/overzicht", beschrijving: "Tabeloverzicht van prestaties met filters op klant, werknemer, maand, bron en status. Bulk goedkeuren en exporteren." },
      { naam: "Records", pad: "/prestaties/records", beschrijving: "Ruwe klokregistraties en prestatierecords met inline bewerking van start-/stoptijden en uren. Inclusief verwijderfunctie." },
    ],
  },
  {
    categorie: "Acerta",
    items: [
      { naam: "Acerta Kalender", pad: "/acerta/kalender", beschrijving: "Kalenderweergave van berekende Acerta looncodes per werknemer per dag. Toont codes 100, 4003, 428, 220, 230, 104 met uren." },
    ],
  },
  {
    categorie: "Beheer",
    items: [
      { naam: "Loonfiches", pad: "/loonfiches", beschrijving: "Beheer en generatie van loonfiches per maand." },
      { naam: "Rapporten", pad: "/rapporten", beschrijving: "Maandelijkse rapportage per werknemer en eindklant met totaal uren, overuren, tekort, omzet en marge." },
    ],
  },
  {
    categorie: "Instellingen",
    items: [
      { naam: "Algemeen", pad: "/instellingen", beschrijving: "Algemene app-instellingen en configuratie." },
      { naam: "Werknemers", pad: "/werknemers", beschrijving: "Volledige werknemersdatabase met alle persoons-, contract- en loongegevens. Toevoegen, bewerken, importeren (CSV/Excel) en statusbeheer." },
      { naam: "Plaatsingen", pad: "/plaatsingen", beschrijving: "Beheer van plaatsingen: koppeling werknemer ↔ eindklant met startdatum, einddatum, functie, uurrooster en facturatietarief." },
      { naam: "Werkspots", pad: "/werkspots", beschrijving: "Beheer van werkplekken per eindklant. Toewijzen van werknemers, auto check-in configuratie, pauze-functionaliteit." },
      { naam: "NFC Badges", pad: "/nfc-badges", beschrijving: "Koppel NFC badge IDs aan werknemers voor automatische check-in." },
      { naam: "Codes", pad: "/prestaties/codes", beschrijving: "Configuratie van prestatiecodes (R, O, N, Z, V, etc.) met naam, kleur, type en standaard uren." },
      { naam: "PDF Import", pad: "/prestaties/import", beschrijving: "Upload prestatie-PDF's van eindklanten. Een AI-agent extraheert uren en maakt conceptregels aan voor review en goedkeuring." },
    ],
  },
  {
    categorie: "Publieke pagina's (geen login)",
    items: [
      { naam: "Location", pad: "/location", beschrijving: "Klokregistratie-interface voor teamleaders op locatie. Login via pincode. Werknemers in-/uitchecken, werkspots beheren, afwijkingen melden, tijdelijke werknemers registreren." },
      { naam: "NFC Check-in", pad: "/nfc", beschrijving: "Automatische check-in pagina via NFC badge scan. Werknemers scannen hun badge en worden automatisch ingecheckt bij hun eindklant." },
    ],
  },
];

const KNOPPEN = [
  { locatie: "Location → Werkspots", knop: "Check-in", beschrijving: "Start klokregistratie voor alle werknemers in een werkspot" },
  { locatie: "Location → Werkspots", knop: "Check-out", beschrijving: "Stop klokregistratie + maakt automatisch een Prestatie record aan met berekende uren" },
  { locatie: "Location → Werkspots", knop: "Pauze", beschrijving: "Pauzeert een werkspot met reden. Timer stopt, wordt hervat bij 'Hervatten'" },
  { locatie: "Location → Werkspots", knop: "Hervatten", beschrijving: "Hervat een gepauzeerde werkspot" },
  { locatie: "Location → Werkspots", knop: "Afwijking (⚠️)", beschrijving: "Meldt een afwijking voor een specifieke werknemer (te laat, ziek, etc.) en stopt eventueel de klokregistratie" },
  { locatie: "Location → Werkspots", knop: "Auto check-in toggle", beschrijving: "Schakelt automatische dagelijkse check-in in/uit om 08:00 op werkdagen" },
  { locatie: "Location → Werkspots", knop: "Toewijzen", beschrijving: "Wijst werknemers toe aan een werkspot via een zoekbare lijst" },
  { locatie: "Location → Werknemers", knop: "Start / Stop", beschrijving: "Individuele klokregistratie per werknemer" },
  { locatie: "Location → Werknemers", knop: "Tijdelijke werknemer", beschrijving: "Registreer een nieuwe tijdelijke werknemer direct op locatie" },
  { locatie: "Prestaties → Import", knop: "Upload PDF", beschrijving: "Upload een prestatie-PDF die door de AI-agent wordt verwerkt tot conceptregels" },
  { locatie: "Prestaties → Import", knop: "Goedkeuren", beschrijving: "Keurt conceptregels goed en maakt definitieve Prestatie records aan" },
  { locatie: "Prestaties → Kalender", knop: "Inline bewerken", beschrijving: "Klik op een cel om uren of code direct te bewerken" },
  { locatie: "Werknemers", knop: "Importeren", beschrijving: "Bulk import van werknemers via CSV of Excel" },
  { locatie: "Acerta → Kalender", knop: "Herberekenen", beschrijving: "Berekent Acerta looncodes opnieuw op basis van prestaties en werknemersconfiguratie" },
  { locatie: "Database Docs", knop: "Backup naar Supabase", beschrijving: "Exporteert alle 13 entities naar de externe Supabase database" },
  { locatie: "Database Docs", knop: "CSV Export", beschrijving: "Download individuele entity-data als CSV bestand" },
  { locatie: "Database Docs", knop: "Exporteer alles", beschrijving: "Download één groot tekstbestand met schema, relaties, permissies, enums en navigatie-documentatie" },
];

export default function NavigatieSection() {
  return (
    <Card>
      <CardHeader><CardTitle>Menu & Navigatie Documentatie</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Menu structuur */}
        <div>
          <h3 className="font-semibold mb-3">Paginaoverzicht per menu-sectie</h3>
          <div className="space-y-4">
            {SECTIONS.map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-bold text-primary mb-2 border-b pb-1">{section.categorie}</h4>
                <div className="space-y-2">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex gap-3 bg-muted/40 rounded-lg px-3 py-2">
                      <div className="shrink-0">
                        <code className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{item.pad}</code>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.naam}</div>
                        <div className="text-xs text-muted-foreground">{item.beschrijving}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knoppen */}
        <div>
          <h3 className="font-semibold mb-3">Belangrijke knoppen & acties</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border font-semibold">Locatie</th>
                  <th className="text-left p-2 border font-semibold">Knop / Actie</th>
                  <th className="text-left p-2 border font-semibold">Beschrijving</th>
                </tr>
              </thead>
              <tbody>
                {KNOPPEN.map((k, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="p-2 border text-xs text-muted-foreground">{k.locatie}</td>
                    <td className="p-2 border text-xs font-semibold">{k.knop}</td>
                    <td className="p-2 border text-xs">{k.beschrijving}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export raw data for the full export
export const NAVIGATION_SECTIONS = SECTIONS;
export const NAVIGATION_BUTTONS = KNOPPEN;