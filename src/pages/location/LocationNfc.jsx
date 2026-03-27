import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Nfc, Play, Square, XCircle, AlertTriangle } from "lucide-react";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationNfc({ klant, onNavigate, onLogout }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [scanning, setScanning] = useState(false);
  const abortRef = useRef(null);
  const resultTimer = useRef(null);

  const handleBadgeScan = useCallback(async (overeenkomstnummer) => {
    setResult(null);
    setError(null);

    try {
      const res = await base44.functions.invoke("nfcCheckin", {
        overeenkomstnummer,
        eindklant_id: klant.id,
      });
      const data = res.data;
      if (data.error) {
        setError(data.error);
        setTimeout(() => setError(null), 4000);
      } else {
        setResult(data);
        if (resultTimer.current) clearTimeout(resultTimer.current);
        resultTimer.current = setTimeout(() => setResult(null), 5000);
      }
    } catch (err) {
      setError("Fout bij verwerken: " + (err.message || "onbekend"));
      setTimeout(() => setError(null), 4000);
    }
  }, [klant.id]);

  useEffect(() => {
    if (!("NDEFReader" in window)) {
      setSupported(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    abortRef.current = controller;

    const startScan = async () => {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan({ signal: controller.signal });
        if (active) setScanning(true);

        ndef.addEventListener("reading", ({ message }) => {
          if (!active) return;
          // Read overeenkomstnummer from NFC tag text record
          let overeenkomstnummer = null;
          for (const record of message.records) {
            if (record.recordType === "text") {
              const decoder = new TextDecoder(record.encoding || "utf-8");
              overeenkomstnummer = decoder.decode(record.data).trim();
              break;
            } else if (record.recordType === "url" || record.recordType === "unknown") {
              const decoder = new TextDecoder("utf-8");
              overeenkomstnummer = decoder.decode(record.data).trim();
              break;
            }
          }
          if (overeenkomstnummer) {
            handleBadgeScan(overeenkomstnummer);
          } else {
            setError("Geen overeenkomstnummer gevonden op badge");
            setTimeout(() => setError(null), 4000);
          }
        }, { signal: controller.signal });

        ndef.addEventListener("readingerror", () => {
          if (active) {
            setError("Badge kon niet gelezen worden");
            setTimeout(() => setError(null), 3000);
          }
        }, { signal: controller.signal });
      } catch (err) {
        if (!active) return;
        if (err.name === "NotAllowedError") {
          setError("NFC toegang geweigerd. Sta NFC toe in je browser.");
        } else if (err.name === "NotSupportedError") {
          setSupported(false);
        } else if (err.name !== "AbortError") {
          setError("NFC fout: " + err.message);
        }
      }
    };

    startScan();

    return () => {
      active = false;
      controller.abort();
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, [handleBadgeScan]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="nfc" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-16 flex flex-col">
        <div className="bg-[#0f2744] text-white px-6 py-4">
          <h1 className="text-lg font-bold">NFC Badge Scanner</h1>
          <p className="text-xs text-white/60">{klant.naam}</p>
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
          ) : (
            <div className="text-center">
              <div className={`w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                scanning ? "bg-blue-50 border-4 border-blue-200 animate-pulse" : "bg-gray-100 border-4 border-gray-200"
              }`}>
                <Nfc className={`w-16 h-16 ${scanning ? "text-blue-500" : "text-gray-300"}`} />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                {scanning ? "Klaar om te scannen" : "NFC starten..."}
              </h2>
              <p className="text-sm text-gray-400">
                Houd de NFC badge tegen de achterkant van het apparaat
              </p>
              {scanning && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-xs text-blue-500 font-medium">Scanner actief</span>
                </div>
              )}
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
          </div>
        )}
      </div>
    </div>
  );
}