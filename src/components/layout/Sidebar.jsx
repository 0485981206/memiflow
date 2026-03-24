import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  Building2,
  Link2,
  Clock,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

const mainMenu = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Werknemers", path: "/werknemers", icon: Users },
  { label: "Eindklanten", path: "/eindklanten", icon: Building2 },
  { label: "Plaatsingen", path: "/plaatsingen", icon: Link2 },
];

const prestatieMenu = [
  { label: "Kalender", path: "/prestaties/kalender" },
  { label: "Kalenderoverzicht", path: "/prestaties/kalenderoverzicht" },
  { label: "Overzicht", path: "/prestaties/overzicht" },
  { label: "Codes", path: "/prestaties/codes" },
  { label: "PDF Import", path: "/prestaties/import" },
];

const acertaMenu = [
  { label: "Kalender", path: "/acerta/kalender" },
];

const beheerMenu = [
  { label: "Loonfiches", path: "/loonfiches", icon: FileText },
  { label: "Rapporten", path: "/rapporten", icon: BarChart3 },
  { label: "Instellingen", path: "/instellingen", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [prestatiesOpen, setPrestatiesOpen] = useState(
    location.pathname.startsWith("/prestaties")
  );
  const [acertaOpen, setAcertaOpen] = useState(
    location.pathname.startsWith("/acerta")
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [importBadge, setImportBadge] = useState(0);

  useEffect(() => {
    const fetchBadge = async () => {
      const batches = await base44.entities.PrestatieImportBatch.filter({ status: "klaar_voor_review" });
      setImportBadge(batches.length);
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 10000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const linkClass = (path) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-[#1e3a5f] text-white"
        : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#152d4a" }}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Memi's Uitzend
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
          Hoofdmenu
        </p>

        {mainMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={linkClass(item.path)}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Prestaties dropdown */}
        <button
          onClick={() => setPrestatiesOpen(!prestatiesOpen)}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname.startsWith("/prestaties")
              ? "bg-[#1e3a5f] text-white"
              : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Prestaties</span>
          </div>
          {prestatiesOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {prestatiesOpen && (
          <div className="ml-7 space-y-0.5">
            {prestatieMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-[#38bdf8] font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
                {item.path === "/prestaties/import" && importBadge > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {importBadge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Acerta dropdown */}
        <button
          onClick={() => setAcertaOpen(!acertaOpen)}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname.startsWith("/acerta")
              ? "bg-[#1e3a5f] text-white"
              : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Acerta</span>
          </div>
          {acertaOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {acertaOpen && (
          <div className="ml-7 space-y-0.5">
            {acertaMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-[#38bdf8] font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="pt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            Beheer
          </p>
          {beheerMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={linkClass(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/30">© 2026 Memi Group</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white"
        style={{ backgroundColor: "#152d4a" }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#152d4a" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}