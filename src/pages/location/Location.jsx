import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
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

  const handleLogin = useCallback(async (pincode) => {
    setError("");
    setLoginLoading(true);
    const res = await base44.functions.invoke("klokLogin", { pincode });
    setLoginLoading(false);

    if (res.data.error) {
      setError(res.data.error);
      return;
    }

    setKlant(res.data.klant);
    setWerknemers(res.data.werknemers);
    setActieveRegistraties(res.data.actieveRegistraties || []);
    setLoggedIn(true);
  }, []);

  const handleAction = useCallback(async (action, werknemerIds) => {
    setActionLoading(true);
    const res = await base44.functions.invoke("klokRegistratie", {
      action,
      werknemer_ids: werknemerIds,
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
    });
    setActionLoading(false);

    if (res.data.error) {
      setError(res.data.error);
      return;
    }

    // Refresh data
    const refresh = await base44.functions.invoke("klokLogin", { pincode: "__refresh__" });
    // Re-login to refresh — but we don't have the pincode anymore, so update locally
    if (action === "start") {
      const newRegs = res.data.results
        .filter((r) => r.status === "gestart")
        .map((r) => ({
          werknemer_id: r.werknemer_id,
          start_tijd: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", hour12: false }),
          status: "gestart",
        }));
      setActieveRegistraties((prev) => [...prev, ...newRegs]);
    } else {
      const stoppedIds = res.data.results.filter((r) => r.status === "gestopt").map((r) => r.werknemer_id);
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