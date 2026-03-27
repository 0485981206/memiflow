import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
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
  ChevronLeft,
  Menu,
  X,
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  Euro,
  Key,
  MapPin,
  Nfc
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const overzichtMenu = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Workspaces", path: "/workspace", icon: Grid3x3 },
];

const prestatieMenu = [
  { label: "Kalender", path: "/prestaties/kalender" },
  { label: "Kalenderoverzicht", path: "/prestaties/kalenderoverzicht" },
  { label: "Overzicht", path: "/prestaties/overzicht" },
  { label: "Records", path: "/prestaties/records" },
];

const acertaMenu = [
  { label: "Kalender", path: "/acerta/kalender" },
];

const instellingenMenu = [
  { label: "Algemeen", path: "/instellingen" },
  { label: "Werknemers", path: "/werknemers" },
  { label: "Plaatsingen", path: "/plaatsingen" },
  { label: "Werkspots", path: "/werkspots" },
  { label: "NFC Badges", path: "/nfc-badges" },
  { label: "Codes", path: "/prestaties/codes" },
  { label: "PDF Import", path: "/prestaties/import" },
];

const instellingenPaths = ["/instellingen", "/werknemers", "/plaatsingen", "/werkspots", "/nfc-badges", "/prestaties/codes", "/prestaties/import"];

const beheerMenu = [
  { label: "Loonfiches", path: "/loonfiches", icon: FileText },
  { label: "Rapporten", path: "/rapporten", icon: BarChart3 },
];

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const location = useLocation();
  const [prestatiesOpen, setPrestatiesOpen] = useState(
    location.pathname.startsWith("/prestaties")
  );
  const [acertaOpen, setAcertaOpen] = useState(
    location.pathname.startsWith("/acerta")
  );
  const [instellingenOpen, setInstellingenOpen] = useState(
    instellingenPaths.includes(location.pathname)
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

  const CollapsedLink = ({ to, icon: Icon, label, badge }) => (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
            isActive(to) ? "bg-[#1e3a5f] text-white" : "text-white/60 hover:text-white hover:bg-[#1e3a5f]/60"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <div className="relative">
            <Icon className="w-5 h-5" />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {badge}
              </span>
            )}
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );

  const CollapsedMenuLink = ({ to, icon: Icon, label, subItems, badge, isActiveCheck }) => {
    const [hovering, setHovering] = useState(false);
    const [pos, setPos] = useState({ top: 0 });
    const btnRef = React.useRef(null);
    const active = isActiveCheck ? isActiveCheck() : isActive(to);

    const handleEnter = () => {
      setHovering(true);
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.top });
      }
    };

    return (
      <div
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovering(false)}
        ref={btnRef}
      >
        <Link
          to={to}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
            active ? "bg-[#1e3a5f] text-white" : "text-white/60 hover:text-white hover:bg-[#1e3a5f]/60"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <div className="relative">
            <Icon className="w-5 h-5" />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {badge}
              </span>
            )}
          </div>
        </Link>
        {hovering && subItems && subItems.length > 0 && ReactDOM.createPortal(
          <div
            className="fixed z-[9999]"
            style={{ top: pos.top, left: 0, paddingLeft: 64 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <div
              className="py-2 px-1 rounded-lg shadow-xl min-w-[180px] ml-1"
              style={{ backgroundColor: "#152d4a" }}
            >
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
              {subItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    location.pathname === item.path
                      ? "text-[#38bdf8] font-semibold bg-white/5"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => { setMobileOpen(false); setHovering(false); }}
                >
                  <span>{item.label}</span>
                  {item.path === "/prestaties/import" && importBadge > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                      {importBadge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  };

  const collapsedContent = (
    <div className="flex flex-col h-full items-center" style={{ backgroundColor: "#152d4a" }}>
      <div className="py-5 border-b border-white/10 w-full flex justify-center">
        <span className="text-lg font-bold text-white">H</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto flex flex-col items-center w-full">
        <CollapsedLink to="/" icon={LayoutDashboard} label="Dashboard" />
        <CollapsedLink to="/workspace" icon={Grid3x3} label="Workspaces" />
        <div className="w-8 border-t border-white/10 my-2" />
        <CollapsedLink to="/eindklanten" icon={Building2} label="Klanten" />
        <CollapsedLink to="/finance" icon={Euro} label="Finance" />
        <div className="w-8 border-t border-white/10 my-2" />
        <CollapsedMenuLink
          to={prestatieMenu[0].path}
          icon={Clock}
          label="Prestaties"
          subItems={prestatieMenu}
          isActiveCheck={() => location.pathname.startsWith("/prestaties") && !instellingenPaths.includes(location.pathname)}
        />
        <div className="w-8 border-t border-white/10 my-2" />
        <CollapsedMenuLink
          to={acertaMenu[0].path}
          icon={FileText}
          label="Acerta"
          subItems={acertaMenu}
          isActiveCheck={() => location.pathname.startsWith("/acerta")}
        />
        <div className="w-8 border-t border-white/10 my-2" />
        <CollapsedMenuLink
          to={beheerMenu[0].path}
          icon={BarChart3}
          label="Beheer"
          subItems={beheerMenu}
          isActiveCheck={() => ["/loonfiches", "/rapporten"].includes(location.pathname)}
        />
        <div className="w-8 border-t border-white/10 my-2" />
        <CollapsedMenuLink
          to={instellingenMenu[0].path}
          icon={Settings}
          label="Instellingen"
          subItems={instellingenMenu}
          badge={importBadge}
          isActiveCheck={() => instellingenPaths.includes(location.pathname)}
        />
      </nav>
      <div className="py-4 border-t border-white/10 w-full flex justify-center">
        <button
          onClick={onToggleCollapse}
          className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#152d4a" }}>
      {/* Logo + collapse toggle */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">
          HR.iQ
        </h1>
        <button
          onClick={onToggleCollapse}
          className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 hidden lg:block"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Overzicht */}
        <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <LayoutDashboard className="w-3 h-3" /> Overzicht
        </p>
        {overzichtMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
              location.pathname === item.path ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Klanten */}
        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <Building2 className="w-3 h-3" /> Klanten
        </p>
        <Link
          to="/eindklanten"
          className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
            location.pathname === "/eindklanten" ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <span>Overzicht</span>
        </Link>
        <Link
          to="/klant-pincodes"
          className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
            location.pathname === "/klant-pincodes" ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <span>Pincodes</span>
        </Link>
        <Link
          to="/werkspots"
          className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
            location.pathname === "/werkspots" ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <span>Werkspots</span>
        </Link>
        <Link
          to="/nfc-badges"
          className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
            location.pathname === "/nfc-badges" ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <span>NFC Badges</span>
        </Link>

        {/* Finance */}
        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <Euro className="w-3 h-3" /> Finance
        </p>
        <Link
          to="/finance"
          className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
            location.pathname === "/finance" ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <span>Dashboard</span>
        </Link>

        {/* Prestaties */}
        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Prestaties
        </p>
        {prestatieMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
              location.pathname === item.path ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Acerta */}
        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <FileText className="w-3 h-3" /> Acerta
        </p>
        {acertaMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
              location.pathname === item.path ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Beheer */}
        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" /> Beheer
        </p>
        {beheerMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2 ml-2 rounded-md text-sm transition-all duration-200 ${
              location.pathname === item.path ? "text-[#38bdf8] font-semibold" : "text-white/60 hover:text-white"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Instellingen */}
        <p
          onClick={() => setInstellingenOpen(!instellingenOpen)}
          className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5 cursor-pointer hover:text-white/60 transition-colors"
        >
          <Settings className="w-3 h-3" /> Instellingen
          {instellingenOpen ? (
            <ChevronDown className="w-3 h-3 ml-auto" />
          ) : (
            <ChevronRight className="w-3 h-3 ml-auto" />
          )}
        </p>

        {instellingenOpen && (
          <div className="ml-7 space-y-0.5">
            {instellingenMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  location.pathname === item.path
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
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/30">© 2026 HR.iQ</p>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
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
          collapsed ? "w-16" : "w-60"
        } ${
          mobileOpen ? "translate-x-0 w-60" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: "#152d4a" }}
      >
        {collapsed && !mobileOpen ? collapsedContent : sidebarContent}
      </aside>
    </TooltipProvider>
  );
}