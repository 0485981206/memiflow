// Hardcoded fallback — wordt overschreven door DB codes wanneer beschikbaar
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

// 38-uren werkweek: ma-do 8u, vr 6u, za-zo 0u
const DAGMAX = { 0: 0, 1: 8, 2: 8, 3: 8, 4: 8, 5: 6, 6: 0 };

function r2(n) { return Math.round(n * 100) / 100; }

export function getDagmax(dayOfWeek) { return DAGMAX[dayOfWeek] || 0; }
export function isFeestdag(datumStr) { return FEESTDAGEN.has(datumStr); }

export function buildCodeMap(dbCodes) {
  if (!dbCodes || dbCodes.length === 0) return PRESTATIE_CODES;
  const map = {};
  dbCodes.forEach(c => { map[c.code] = { naam: c.naam, kleur: c.kleur || "#999" }; });
  return map;
}

function getCodeInfo(code, codeMap) {
  return codeMap?.[code] || PRESTATIE_CODES[code] || { naam: code, kleur: "#999" };
}

/**
 * Haal ploegconfig op voor een werknemer.
 * @param {Object|null} werknemer — werknemer record uit DB
 * @param {number} dayOfWeek — JS getDay() 0-6
 * @returns {{ type: string, dagploegUren: number, nachtploegUren: number, dagmax: number }}
 */
function getPloegConfig(werknemer, dayOfWeek) {
  const dagmax = DAGMAX[dayOfWeek] || 0;
  if (!werknemer || !werknemer.ploeg_type || werknemer.ploeg_type === "dagploeg") {
    return { type: "dagploeg", dagploegUren: dagmax, nachtploegUren: 0, dagmax };
  }
  // dag_nacht
  const isVrijdag = dayOfWeek === 5;
  const dpUren = isVrijdag
    ? (werknemer.dagploeg_uren_vr ?? 3)
    : (werknemer.dagploeg_uren_mado ?? 5);
  const npUren = isVrijdag
    ? (werknemer.nachtploeg_uren_vr ?? 3)
    : (werknemer.nachtploeg_uren_mado ?? 3);
  return { type: "dag_nacht", dagploegUren: dpUren, nachtploegUren: npUren, dagmax };
}

/**
 * BESLISBOOM met ploegverdeling.
 *
 * @param {string} datumStr "yyyy-MM-dd"
 * @param {number} dayOfWeek JS getDay() 0-6
 * @param {number|null} gewerkte_uren null = geen data in CSV
 * @param {Object} [codeMap] optioneel, DB-codes map
 * @param {Object|null} [werknemer] optioneel, werknemer record met ploeg_type
 * @returns {Array<{uren: number, code: string, naam: string, kleur: string, isSecondary: boolean}>}
 */
export function berekenPrestatieCodes(datumStr, dayOfWeek, gewerkte_uren, codeMap, werknemer) {
  const map = codeMap || PRESTATIE_CODES;
  const ploeg = getPloegConfig(werknemer, dayOfWeek);
  const dagmax = ploeg.dagmax;

  // 1. WEEKEND → LEEG
  if (dagmax === 0) return [];

  // 2. FEESTDAG
  if (FEESTDAGEN.has(datumStr)) {
    const c220 = getCodeInfo("220", map);
    return [
      { uren: r2(dagmax), code: "220", naam: c220.naam, kleur: c220.kleur, isSecondary: false },
    ];
  }

  // 3. GEEN UREN IN CSV
  if (gewerkte_uren === null || gewerkte_uren === undefined) {
    const c230 = getCodeInfo("230", map);
    const c100 = getCodeInfo("100", map);
    return [
      { uren: r2(dagmax), code: "230", naam: c230.naam, kleur: c230.kleur, isSecondary: false },
      { uren: r2(dagmax), code: "100", naam: c100.naam, kleur: c100.kleur, isSecondary: false },
    ];
  }

  const uren = r2(gewerkte_uren);
  const lines = [];

  // 4. Verdeel volgens ploegprofiel
  if (ploeg.type === "dag_nacht") {
    // Dagploeg lijn
    const c100 = getCodeInfo("100", map);
    lines.push({ uren: r2(ploeg.dagploegUren), code: "100", naam: c100.naam, kleur: c100.kleur, isSecondary: false });
    // Nachtploeg lijn
    if (ploeg.nachtploegUren > 0) {
      const c104 = getCodeInfo("104", map);
      lines.push({ uren: r2(ploeg.nachtploegUren), code: "104", naam: c104.naam, kleur: c104.kleur, isSecondary: false });
    }
  } else {
    // Alleen dagploeg
    const c100 = getCodeInfo("100", map);
    const basisUren = Math.min(uren, dagmax);
    lines.push({ uren: r2(basisUren), code: "100", naam: c100.naam, kleur: c100.kleur, isSecondary: false });
  }

  // Overuren of tekort
  if (uren > dagmax) {
    const c4003 = getCodeInfo("4003", map);
    lines.push({ uren: r2(uren - dagmax), code: "4003", naam: c4003.naam, kleur: c4003.kleur, isSecondary: true });
  } else if (uren < dagmax) {
    const c428 = getCodeInfo("428", map);
    lines.push({ uren: r2(dagmax - uren), code: "428", naam: c428.naam, kleur: c428.kleur, isSecondary: true });
  }

  return lines;
}