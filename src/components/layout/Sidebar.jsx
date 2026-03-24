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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [importBadge, setImportBadge] = useState(0);

  useEffect(() => {
    const fetchBadge = async () => {
      const batches = await base44.entities.PrestatieImportBatch.filter({ 
        status: "klaar_voor_review" 
      });
      setImportBadge(batches.length);
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isCollapsed || !openDropdown) return;
    
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isCollapsed, openDropdown]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
    if (!isCollapsed) {
      closeDropdown();
    }
  };

  const MenuLink = ({ item }) => (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive(item.path)
          ? "bg-[#1e3a5f] text-white"
          : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
      }`}
      onClick={handleNavClick}
      title={isCollapsed ? item.label : ""}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );

  const MenuButton = ({ icon: Icon, label, name, onClick, isActive: active }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full relative ${
        active
          ? "bg-[#1e3a5f] text-white"
          : "text-white/80 hover:text-white hover:bg-[#1e3a5f]/60"
      }`}
      title={isCollapsed ? label : ""}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openDropdown === name ? "rotate-180" : ""
            }`}
          />
        </>
      )}
      {isCollapsed && openDropdown === name && (
        <div className="absolute w-1 h-1 rounded-full bg-white right-1.5"></div>
      )}
    </button>
  );

  const Dropdown = ({ isOpen, items }) => {
    if (!isOpen) return null;

    if (isCollapsed) {
      return (
        <div className="fixed bg-[#1e3a5f] rounded-lg shadow-lg py-2 z-50 min-w-48 border border-white/10" style={{
          left: '5rem',
          top: '0',
          marginTop: '0'
        }}>
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-[#2a4a6f] transition-colors"
              onClick={handleNavClick}
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
      );
    }

    return (
      <div className="ml-7 space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
              isActive(item.path)
                ? "text-[#38bdf8] font-semibold"
                : "text-white/60 hover:text-white"
            }`}
            onClick={handleNavClick}
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
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white"
        style={{ backgroundColor: "#152d4a" }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 lg:translate-x-0 flex flex-col ${
          mobileOpen ? "translate-x-0 w-60" : "-translate-x-full w-60"
        } ${!mobileOpen && isCollapsed ? "lg:w-20" : "lg:w-60"}`}
        style={{ backgroundColor: "#152d4a" }}
      >
        {/* Header */}
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between gap-3">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white tracking-tight">
              Memi's Uitzend
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            title={isCollapsed ? "Uitvouwen" : "Samenvouwen"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? "px-1.5" : "px-3"}`}>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-3">
              Hoofdmenu
            </p>
          )}

          {/* Main Menu */}
          {mainMenu.map((item) => (
            <MenuLink key={item.path} item={item} />
          ))}

          {/* Prestaties Dropdown */}
          <div className="relative">
            <MenuButton
              icon={Clock}
              label="Prestaties"
              name="prestaties"
              onClick={() => toggleDropdown("prestaties")}
              isActive={location.pathname.startsWith("/prestaties")}
            />
            {openDropdown === "prestaties" && (
              <Dropdown isOpen={true} items={prestatieMenu} />
            )}
          </div>

          {/* Acerta Dropdown */}
          <div className="relative">
            <MenuButton
              icon={FileText}
              label="Acerta"
              name="acerta"
              onClick={() => toggleDropdown("acerta")}
              isActive={location.pathname.startsWith("/acerta")}
            />
            {openDropdown === "acerta" && (
              <Dropdown isOpen={true} items={acertaMenu} />
            )}
          </div>

          {/* Beheer Section */}
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40 mt-6 mb-3">
              Beheer
            </p>
          )}
          {beheerMenu.map((item) => (
            <MenuLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-t border-white/10">
            <p className="text-xs text-white/30">© 2026 Memi Group</p>
          </div>
        )}
      </aside>
    </>
  );
}