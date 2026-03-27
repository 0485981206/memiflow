import React from "react";
import { Home, MapPin, ClipboardList, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const items = [
  { icon: Home, label: "Werknemers", id: "home" },
  { icon: MapPin, label: "Werkspots", id: "werkspots" },
  { icon: ClipboardList, label: "Registraties", id: "records" },
];

export default function LocationSidebar({ activePage = "home", onNavigate, onLogout }) {
  return (
    <TooltipProvider>
      <aside className="fixed top-0 left-0 h-screen w-16 flex flex-col items-center py-4 z-50" style={{ backgroundColor: "#0c1f36" }}>
        <div className="text-white font-bold text-lg mb-6">H</div>
        <nav className="flex-1 flex flex-col items-center gap-2">
          {items.map((item) => {
            const isActive = activePage === item.id;
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onNavigate?.(item.id)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors mb-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Afmelden</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}