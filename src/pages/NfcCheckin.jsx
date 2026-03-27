import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, XCircle, Clock, LogIn, LogOut } from "lucide-react";

export default function NfcCheckin() {
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nfcId = params.get("id");

    if (!nfcId) {
      setStatus("error");
      setError("Geen badge ID gevonden in de URL");
      return;
    }

    const doCheckin = async () => {
      try {
        const response = await base44.functions.invoke("nfcCheckin", { nfc_id: nfcId });
        setResult(response.data);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err?.response?.data?.error || "Er ging iets mis bij het inchecken");
      }
    };

    doCheckin();
  }, []);

  const isStart = result?.action === "start";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2744] to-[#1a3a5c] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-1">HR.iQ</h1>
        <p className="text-xs text-gray-400 mb-8">NFC Badge Check-in</p>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-600 font-medium">Bezig met registreren...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-red-600 font-semibold text-lg">Fout</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              isStart ? "bg-green-100" : "bg-orange-100"
            }`}>
              {isStart ? (
                <LogIn className="w-10 h-10 text-green-600" />
              ) : (
                <LogOut className="w-10 h-10 text-orange-600" />
              )}
            </div>

            <div>
              <p className={`text-2xl font-bold ${isStart ? "text-green-600" : "text-orange-600"}`}>
                {isStart ? "Ingecheckt!" : "Uitgecheckt!"}
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-2">{result.werknemer_naam}</p>
              <p className="text-sm text-gray-500">{result.eindklant_naam}</p>
            </div>

            <div className={`rounded-xl p-4 mt-4 ${isStart ? "bg-green-50" : "bg-orange-50"}`}>
              <div className="flex items-center justify-center gap-2">
                <Clock className={`w-5 h-5 ${isStart ? "text-green-600" : "text-orange-600"}`} />
                <span className={`text-xl font-bold ${isStart ? "text-green-700" : "text-orange-700"}`}>
                  {result.start_tijd}
                  {!isStart && ` — ${result.stop_tijd}`}
                </span>
              </div>
              {!isStart && result.totaal_uren && (
                <p className="text-sm text-orange-600 mt-1">
                  Totaal: {result.totaal_uren} uur
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}