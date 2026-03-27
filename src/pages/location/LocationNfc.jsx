import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Nfc, Loader2, CheckCircle2, XCircle, Play, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationNfc({ klant, onNavigate, onLogout }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const readerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!("NDEFReader" in window)) {
      setSupported(false);
    }
    return () => stopScanning();
  }, []);

  const startScanning = async () => {
    setResult(null);
    setError(null);
    setScanning(true);

    try {
      const ndef = new window.NDEFReader();
      const controller = new AbortController();
      abortRef.current = controller;
      readerRef.current = ndef;

      await ndef.scan({ signal: controller.signal });

      ndef.addEventListener("reading", async ({ serialNumber }) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        await handleBadgeScan(nfcId);
      }, { signal: controller.signal });

      ndef.addEventListener("readingerror", () => {
        setError("Badge kon niet gelezen worden. Probeer opnieuw.");
      }, { signal: controller.signal });
    } catch (err) {
      setScanning(false);
      if (err.name === "NotAllowedError") {
        setError("NFC toegang geweigerd. Sta NFC toe in je browser instellingen.");
      } else if (err.name === "NotSupportedError") {
        setSupported(false);
      } else {
        setError("Kon NFC scanner niet starten: " + err.message);
      }
    }
  };

  const stopScanning = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setScanning(false);
  };

  const handleBadgeScan = async (nfcId) => {
    setResult(null);
    setError(null);

    try {
      const res = await base44.functions.invoke("nfcCheckin", {
        nfc_id: nfcId,
        eindklant_id: klant.id,
      });

      const data = res.data;
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        // Auto-clear result after 5 seconds
        setTimeout(() => setResult(null), 5000);
      }
    } catch (err) {
      setError("Fout bij verwerken badge: " + (err.message || "onbekend"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="nfc" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-16 flex flex-col">
        <div className="bg-[#0f2744] text-white px-6 py-4">
          <h1 className="text-lg font-bold">NFC Badge Scanner</h1>
          <p className="text-xs text-white/60">{klant.naam} — Scan een badge om in/uit te checken</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          {!supported ? (
            <div className="text-center max-w-sm">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-700 mb-2">NFC niet beschikbaar</h2>
              <p className="text-sm text-gray-500">
                Web NFC wordt alleen ondersteund op Android met Chrome. Zorg dat NFC is ingeschakeld op je apparaat.
              </p>
            </div>
          ) : !scanning ? (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Nfc className="w-16 h-16 text-gray-300" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Klaar om te scannen</h2>
              <p className="text-sm text-gray-400 mb-6">Start de scanner en houd een NFC badge tegen het apparaat</p>
              <Button size="lg" onClick={startScanning} className="gap-2">
                <Nfc className="w-5 h-5" /> Scanner starten
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Nfc className="w-16 h-16 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Wacht op badge...</h2>
              <p className="text-sm text-gray-400 mb-6">Houd een NFC badge tegen de achterkant van het apparaat</p>
              <Button variant="outline" onClick={stopScanning} className="gap-2">
                <Square className="w-4 h-4" /> Scanner stoppen
              </Button>
            </div>
          )}
        </div>

        {/* Result overlay */}
        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setResult(null)}>
            <div
              className={`mx-4 w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl ${
                result.action === "start" ? "bg-green-500" : "bg-blue-500"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {result.action === "start" ? (
                <Play className="w-16 h-16 text-white mx-auto mb-4" />
              ) : (
                <Square className="w-16 h-16 text-white mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-white mb-1">
                {result.action === "start" ? "Ingecheckt!" : "Uitgecheckt!"}
              </h2>
              <p className="text-lg text-white/90 font-medium">{result.werknemer_naam}</p>
              <p className="text-sm text-white/70 mt-1">{result.eindklant_naam}</p>
              <div className="mt-4 bg-white/20 rounded-lg py-2 px-4 inline-block">
                {result.action === "start" ? (
                  <p className="text-white font-mono text-lg">Start: {result.start_tijd}</p>
                ) : (
                  <p className="text-white font-mono text-lg">
                    {result.start_tijd} → {result.stop_tijd}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white rounded-lg px-6 py-3 shadow-lg flex items-center gap-2 max-w-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-2 text-white/70 hover:text-white">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}