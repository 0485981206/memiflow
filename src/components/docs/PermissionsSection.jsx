import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Globe, Users } from "lucide-react";

export default function PermissionsSection() {
  return (
    <Card>
      <CardHeader><CardTitle>Toegangscontrole & Permissies</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Rollen */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Gebruikersrollen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 bg-blue-50 border-blue-200">
              <div className="font-semibold text-blue-800 mb-1">admin</div>
              <ul className="text-xs text-blue-700 space-y-1 list-disc ml-4">
                <li>Volledige CRUD op alle entities</li>
                <li>Gebruikers uitnodigen en beheren</li>
                <li>Backup naar Supabase triggeren</li>
                <li>CSV exports downloaden</li>
                <li>Toegang tot alle pagina's</li>
              </ul>
            </div>
            <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
              <div className="font-semibold text-gray-800 mb-1">user</div>
              <ul className="text-xs text-gray-700 space-y-1 list-disc ml-4">
                <li>Lees-toegang tot eigen records</li>
                <li>Beperkte schrijfrechten</li>
                <li>Kan alleen eigen profiel bewerken</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabel toegang */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Toegang per tabel</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border font-semibold">Tabel</th>
                  <th className="text-center p-2 border font-semibold">Admin</th>
                  <th className="text-center p-2 border font-semibold">User</th>
                  <th className="text-left p-2 border font-semibold">Opmerking</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { table: "User", admin: "CRUD", user: "Alleen eigen profiel", note: "Built-in entity met speciale RLS" },
                  { table: "Werknemer", admin: "CRUD", user: "CRUD", note: "Basis data werknemers" },
                  { table: "Eindklant", admin: "CRUD", user: "CRUD", note: "Klantgegevens" },
                  { table: "Werkspot", admin: "CRUD", user: "CRUD", note: "Via location backend functions" },
                  { table: "Plaatsing", admin: "CRUD", user: "Lezen", note: "Koppeling werknemer ↔ klant" },
                  { table: "Prestatie", admin: "CRUD", user: "Lezen", note: "Prestatieregistraties" },
                  { table: "PrestatieCode", admin: "CRUD", user: "Lezen", note: "Prestatiecodes configuratie" },
                  { table: "PrestatieImportBatch", admin: "CRUD", user: "Lezen", note: "PDF import batches" },
                  { table: "PrestatieConceptRegel", admin: "CRUD", user: "Lezen", note: "Concept regels uit imports" },
                  { table: "AcertaCode", admin: "CRUD", user: "Lezen", note: "Berekende Acerta loonlijnen" },
                  { table: "FinancieelRapport", admin: "CRUD", user: "Lezen", note: "Financiële maandrapporten" },
                  { table: "Klokregistratie", admin: "CRUD", user: "CRUD", note: "Via location backend functions" },
                  { table: "TijdelijkeWerknemer", admin: "CRUD", user: "CRUD", note: "Via location backend functions" },
                  { table: "Afwijking", admin: "CRUD", user: "CRUD", note: "Via location backend functions" },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="p-2 border font-mono text-xs font-semibold">{r.table}</td>
                    <td className="p-2 border text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-bold">{r.admin}</span></td>
                    <td className="p-2 border text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">{r.user}</span></td>
                    <td className="p-2 border text-xs text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Publieke routes */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> Publieke routes (geen login vereist)</h3>
          <div className="space-y-2">
            {[
              { route: "/location", desc: "Klokregistratie interface voor teamleaders (pincode-login)" },
              { route: "/nfc", desc: "NFC badge check-in pagina" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <code className="text-xs font-mono font-bold text-amber-800">{r.route}</code>
                <span className="text-xs text-amber-700">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend functions met admin-only */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Admin-only backend functions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              "backupToSupabase", "exportCsv", "berekenAcertaCodes",
              "berekenFinancieelRapport", "autoCheckin", "importPlaatsingen",
            ].map(fn => (
              <div key={fn} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs font-mono text-red-700">{fn}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}