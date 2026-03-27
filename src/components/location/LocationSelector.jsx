import React from "react";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LocationSelector({ klanten = [], onSelect, onLogout }) {
  return (
    <div className="min-h-screen bg-[#0f2744] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-[#0f2744] text-white text-center py-6 px-4">
          <h1 className="text-2xl font-bold tracking-tight">HR.iQ</h1>
          <p className="text-sm text-white/70 mt-1">Superuser — Selecteer locatie</p>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {klanten.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Geen actieve klanten gevonden</p>
          ) : (
            klanten.map((k) => (
              <button
                key={k.id}
                onClick={() => onSelect(k)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{k.naam}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full text-gray-500" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Afmelden
          </Button>
        </div>
      </div>
    </div>
  );
}