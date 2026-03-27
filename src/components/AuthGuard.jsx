import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function AuthGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) {
        base44.auth.redirectToLogin();
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authenticated) return null;

  return children;
}