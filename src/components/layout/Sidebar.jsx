import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Link2,
  Clock,
  FileText,
  Receipt,
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
  { label: "Overzicht", path: "/prestaties/overzicht" },
  { label: "Codes", path: "/prestaties/codes" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const linkClass = (path) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-primary-foreground"
        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Memi's Uitzend
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-2">
          Hoofdmenu
        </p>
        {mainMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={linkClass(item.path)}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </Link>
        ))}

        <button
          onClick={() => setPrestatiesOpen(!prestatiesOpen)}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname.startsWith("/prestaties")
              ? "bg-sidebar-accent text-sidebar-primary-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4.5 h-4.5" />
            Prestaties
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
                className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div className="pt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-2">
            Beheer
          </p>
          {beheerMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={linkClass(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">
          © 2026 Memi Group
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar-background rounded-lg text-white"
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
        className={`fixed top-0 left-0 h-screen w-60 bg-sidebar-background z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}