import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PincodeLogin from "./PincodeLogin";
import EmployeeBoard from "./EmployeeBoard";
import LocationSelector from "../../components/location/LocationSelector";
import LocationWerkspots from "./LocationWerkspots";
import LocationRecords from "./LocationRecords";
import LocationTijdelijk from "./LocationTijdelijk";
import LocationNfc from "./LocationNfc";

const SESSION_KEY = "hriq_location_session";
const SESSION_TTL = 12 * 60 * 60 * 1000; // 12 hours

function getSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.timestamp > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export default function Location() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [klant, setKlant] = useState(null);
  const [werknemers, setWerknemers] = useState([]);
  const [actieveRegistraties, setActieveRegistraties] = useState([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [superuserKlanten, setSuperuserKlanten] = useState([]);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activePage, setActivePage] = useState("werkspots");
  const [tijdelijkeWerknemers, setTijdelijkeWerknemers] = useState([]);
  const [autoLogging, setAutoLogging] = useState(true);

  // Auto-login from saved session
  React.useEffect(() => {
    const session = getSavedSession();
    if (session?.klant_id) {
      (async () => {
        try {
          const data = await callFunction("klokLogin", { pincode: "0000", klant_id: session.klant_id });
          setKlant({ id: session.klant_id, naam: session.klant_naam });
          setWerknemers(data.werknemers || []);
          setActieveRegistraties(data.actieveRegistraties || []);
          setLoggedIn(true);
          loadTijdelijkeWerknemers(session.klant_id);
        } catch {}
        setAutoLogging(false);
      })();
    } else {
      setAutoLogging(false);
    }
  }, []);

  const callFunction = async (name, payload) => {
    const response = await base44.functions.invoke(name, payload);
    return response.data;
  };

  const handleLogin = useCallback(async (pincode) => {
    setError("");
    setLoginLoading(true);
    try {
      const data = await callFunction("klokLogin", { pincode });
      setLoginLoading(false);

      if (data.error) {
        setError(data.error);
        return;
      }

      // Superuser flow
      if (data.superuser) {
        setIsSuperuser(true);
        setSuperuserKlanten(data.klanten || []);
        return;
      }

      if (!data.klant) {
        setError("Geen klant gevonden voor deze pincode");
        return;
      }

      setKlant(data.klant);
      setWerknemers(data.werknemers || []);
      setActieveRegistraties(data.actieveRegistraties || []);
      setLoggedIn(true);

      localStorage.setItem(SESSION_KEY, JSON.stringify({
        klant_id: data.klant.id,
        klant_naam: data.klant.naam,
        timestamp: Date.now(),
      }));

      loadTijdelijkeWerknemers(data.klant.id);
    } catch (err) {
      setLoginLoading(false);
      setError("Er ging iets mis. Probeer opnieuw.");
    }
  }, []);

  const handleAction = useCallback(async (action, werknemerIds) => {
    setActionLoading(true);
    const data = await callFunction("klokRegistratie", {
      action,
      werknemer_ids: werknemerIds,
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
    });
    setActionLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    if (action === "start") {
      const newRegs = data.results
        .filter((r) => r.status === "gestart")
        .map((r) => ({
          werknemer_id: r.werknemer_id,
          start_tijd: r.start_tijd || new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", hour12: false }),
          status: "gestart",
        }));
      setActieveRegistraties((prev) => [...prev, ...newRegs]);
    } else {
      const stoppedIds = data.results.filter((r) => r.status === "gestopt").map((r) => r.werknemer_id);
      setActieveRegistraties((prev) => prev.filter((r) => !stoppedIds.includes(r.werknemer_id)));
    }
  }, [klant]);

  const handleSelectKlant = useCallback(async (selectedKlant) => {
    setLoginLoading(true);
    const data = await callFunction("klokLogin", { pincode: "000000", klant_id: selectedKlant.id });
    setLoginLoading(false);
    setKlant(selectedKlant);
    setWerknemers(data.werknemers || []);
    setActieveRegistraties(data.actieveRegistraties || []);
    setIsSuperuser(false);
    setLoggedIn(true);
    loadTijdelijkeWerknemers(selectedKlant.id);
  }, []);

  const loadTijdelijkeWerknemers = useCallback(async (klantId) => {
    const res = await callFunction("tijdelijkeWerknemer", { action: "list", eindklant_id: klantId });
    setTijdelijkeWerknemers(res.records || []);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setKlant(null);
    setWerknemers([]);
    setActieveRegistraties([]);
    setTijdelijkeWerknemers([]);
    setIsSuperuser(false);
    setSuperuserKlanten([]);
    setError("");
    setActivePage("home");
  }, []);

  const handleNavigate = useCallback((page) => {
    setActivePage(page);
  }, []);

  if (autoLogging) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2744] to-[#1a3a5c] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isSuperuser && !loggedIn) {
    return <LocationSelector klanten={superuserKlanten} onSelect={handleSelectKlant} onLogout={handleLogout} />;
  }

  if (!loggedIn) {
    return <PincodeLogin onLogin={handleLogin} error={error} loading={loginLoading} />;
  }

  if (activePage === "werkspots") {
    return <LocationWerkspots klant={klant} werknemers={werknemers} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (activePage === "records") {
    return <LocationRecords klant={klant} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (activePage === "tijdelijk") {
    return <LocationTijdelijk klant={klant} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (activePage === "nfc") {
    return <LocationNfc klant={klant} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  const handleRefresh = useCallback(async () => {
    const data = await callFunction("klokLogin", { pincode: "0000", klant_id: klant.id });
    setWerknemers(data.werknemers || []);
    setActieveRegistraties(data.actieveRegistraties || []);
    loadTijdelijkeWerknemers(klant.id);
  }, [klant]);

  return (
    <EmployeeBoard
      klant={klant}
      werknemers={werknemers}
      actieveRegistraties={actieveRegistraties}
      tijdelijkeWerknemers={tijdelijkeWerknemers}
      onAction={handleAction}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      actionLoading={actionLoading}
      onTijdelijkAdded={() => loadTijdelijkeWerknemers(klant.id)}
      onRefresh={handleRefresh}
    />
  );
}