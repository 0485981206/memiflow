// Vaste prestatiecodes
export const PRESTATIE_CODES = {
  "100":  { naam: "Gewone prestaties",           kleur: "#4A90D9" },
  "4003": { naam: "Netto vrijwillige overuren",  kleur: "#2C3E80" },
  "428":  { naam: "Gerechtvaardigde afwezigheid", kleur: "#E67E22" },
  "220":  { naam: "Wettelijke feestdag",          kleur: "#27AE60" },
  "230":  { naam: "Inhaalrust",                   kleur: "#F1C40F" },
  "50":   { naam: "Ziekte",                       kleur: "#E74C3C" },
  "51":   { naam: "Karenzdag",                    kleur: "#E67E22" },
  "65":   { naam: "Arbeidsongeval",               kleur: "#E74C3C" },
  "371":  { naam: "Werkloos economische reden",   kleur: "#7F8C8D" },
  "104":  { naam: "Nachtploeg",                   kleur: "#1A2744" },
  "135":  { naam: "Overuren nachtploeg",          kleur: "#5B7DB1" },
  "232":  { naam: "Inhaalrust",                   kleur: "#8E44AD" },
  "102":  { naam: "Dagploeg",                     kleur: "#3498DB" },
  "59":   { naam: "Zwangerschapsrust",            kleur: "#FF69B4" },
};

const FEESTDAGEN = new Set([
  "2025-01-01","2025-04-21","2025-05-01","2025-05-29","2025-06-09",
  "2025-07-21","2025-08-15","2025-11-01","2025-11-11","2025-12-25",
  "2026-01-01","2026-04-06","2026-05-01","2026-05-14","2026-05-25",
  "2026-07-21","2026-08-15","2026-11-01","2026-11-11","2026-12-25",
  "2027-01-01","2027-03-29","2027-05-01","2027-05-06","2027-05-17",
  "2027-07-21","2027-08-15","2027-11-01","2027-11-11","2027-12-25",
]);

// Dagmax per JS getDay(): 0=zon, 1=ma, ..., 6=za
const DAGMAX = { 0: 0, 1: 8, 2: 8, 3: 8, 4: 8, 5: 6, 6: 0 };

function r2(n) { return Math.round(n * 100) / 100; }

export function getDagmax(dayOfWeek) { return DAGMAX[dayOfWeek] || 0; }
export function isFeestdag(datumStr) { return FEESTDAGEN.has(datumStr); }

/**
 * @param {string} datumStr "yyyy-MM-dd"
 * @param {number} dayOfWeek JS getDay() 0-6
 * @param {number|null} gewerkte_uren null = geen data
 * @returns {Array<{uren: number, code: string, kleur: string}>}
 */
export function berekenPrestatieCodes(datumStr, dayOfWeek, gewerkte_uren) {
  const dagmax = DAGMAX[dayOfWeek] || 0;

  if (dayOfWeek === 0 || dayOfWeek === 6) return [];

  if (FEESTDAGEN.has(datumStr)) {
    return [
      { uren: r2(dagmax), code: "220", kleur: PRESTATIE_CODES["220"].kleur },
      { uren: r2(dagmax), code: "100", kleur: PRESTATIE_CODES["100"].kleur },
    ];
  }

  if (gewerkte_uren === null || gewerkte_uren === undefined) {
    return [
      { uren: r2(dagmax), code: "230", kleur: PRESTATIE_CODES["230"].kleur },
      { uren: r2(dagmax), code: "100", kleur: PRESTATIE_CODES["100"].kleur },
    ];
  }

  const uren = r2(gewerkte_uren);

  if (uren > dagmax) {
    return [
      { uren: r2(dagmax), code: "100", kleur: PRESTATIE_CODES["100"].kleur },
      { uren: r2(uren - dagmax), code: "4003", kleur: PRESTATIE_CODES["4003"].kleur },
    ];
  }

  if (uren < dagmax) {
    const tekort = r2(dagmax - uren);
    return [
      { uren, code: "100", kleur: PRESTATIE_CODES["100"].kleur },
      { uren: tekort, code: "428", kleur: PRESTATIE_CODES["428"].kleur },
      { uren: tekort, code: "100", kleur: PRESTATIE_CODES["100"].kleur },
    ];
  }

  return [{ uren: r2(dagmax), code: "100", kleur: PRESTATIE_CODES["100"].kleur }];
}