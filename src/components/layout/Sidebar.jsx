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
  X,
  Grid3x3
} from "lucide-react";

const mainMenu = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Workspaces", path: "/workspace", icon: Grid3x3 },
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
  { label: "Records", path: "/prestaties/records" },
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
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

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#152d4a" }}>
      {/* Logo & Collapse Toggle */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-white tracking-tight">
            Memi's Uitzend
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white ml-auto"
          title={isCollapsed ? "Uitvouwen" : "Samenvouwen"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className={`flex-1 py-4 overflow-y-auto transition-all ${isCollapsed ? "px-1.5" : "px-3 space-y-1"}`}>
        {!isCollapsed && (
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            Hoofdmenu
          </p>
        )}

        {mainMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
              isActive(item.path)
                ? "bg-[#1e3a5f] text-white"
                : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
            }`}
            title={isCollapsed ? item.label : ""}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </Link>
        ))}

        {/* Prestaties dropdown */}
        <div
          className="relative"
          onMouseEnter={() => isCollapsed && setHoveredDropdown("prestaties")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >
          <button
            onClick={() => !isCollapsed && setPrestatiesOpen(!prestatiesOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname.startsWith("/prestaties")
                ? "bg-[#1e3a5f] text-white"
                : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
            }`}
            title={isCollapsed ? "Prestaties" : ""}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Prestaties</span>}
            </div>
            {!isCollapsed && (prestatiesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          {/* Collapsed dropdown panel */}
          {isCollapsed && hoveredDropdown === "prestaties" && (
            <div className="absolute left-full top-0 ml-2 bg-[#1e3a5f] rounded-lg shadow-lg py-2 z-50 min-w-48 border border-white/10">
              {prestatieMenu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center justify-between px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-[#2a4a6f] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.path === "/prestaties/import" && importBadge > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {importBadge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Expanded dropdown */}
          {!isCollapsed && prestatiesOpen && (
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
                    <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {importBadge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Acerta dropdown */}
        <div
          className="relative"
          onMouseEnter={() => isCollapsed && setHoveredDropdown("acerta")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >
          <button
            onClick={() => !isCollapsed && setAcertaOpen(!acertaOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname.startsWith("/acerta")
                ? "bg-[#1e3a5f] text-white"
                : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
            }`}
            title={isCollapsed ? "Acerta" : ""}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Acerta</span>}
            </div>
            {!isCollapsed && (acertaOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          {/* Collapsed dropdown panel */}
          {isCollapsed && hoveredDropdown === "acerta" && (
            <div className="absolute left-full top-0 ml-2 bg-[#1e3a5f] rounded-lg shadow-lg py-2 z-50 min-w-48 border border-white/10">
              {acertaMenu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-[#2a4a6f] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Expanded dropdown */}
          {!isCollapsed && acertaOpen && (
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
        </div>

        <div className={`pt-4 ${!isCollapsed ? "space-y-1" : ""}`}>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Beheer
            </p>
          )}
          {beheerMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
                isActive(item.path)
                  ? "bg-[#1e3a5f] text-white"
                  : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
              }`}
              onClick={() => setMobileOpen(false)}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
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
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 w-60" : "-translate-x-full w-60"
        } ${!mobileOpen && isCollapsed ? "lg:w-20" : "lg:w-60"}`}
        style={{ backgroundColor: "#152d4a" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}