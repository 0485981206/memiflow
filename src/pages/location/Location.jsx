import React, { useState, useCallback } from "react";
import { appParams } from "@/lib/app-params";
import PincodeLogin from "./PincodeLogin";
import EmployeeBoard from "./EmployeeBoard";

export default function Location() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [klant, setKlant] = useState(null);
  const [werknemers, setWerknemers] = useState([]);
  const [actieveRegistraties, setActieveRegistraties] = useState([]);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const callFunction = async (name, payload) => {
    const baseUrl = appParams.appBaseUrl || '';
    const res = await fetch(`${baseUrl}/api/functions/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const handleLogin = useCallback(async (pincode) => {
    setError("");
    setLoginLoading(true);
    const data = await callFunction("klokLogin", { pincode });
    setLoginLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    setKlant(data.klant);
    setWerknemers(data.werknemers);
    setActieveRegistraties(data.actieveRegistraties || []);
    setLoggedIn(true);
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

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setKlant(null);
    setWerknemers([]);
    setActieveRegistraties([]);
    setError("");
  }, []);

  if (!loggedIn) {
    return <PincodeLogin onLogin={handleLogin} error={error} loading={loginLoading} />;
  }

  return (
    <EmployeeBoard
      klant={klant}
      werknemers={werknemers}
      actieveRegistraties={actieveRegistraties}
      onAction={handleAction}
      onLogout={handleLogout}
      actionLoading={actionLoading}
    />
  );
}