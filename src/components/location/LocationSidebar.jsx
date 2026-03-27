import React from "react";
import { Home, MapPin, Nfc, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const items = [
  { icon: Home, label: "Home", id: "home" },
  { icon: MapPin, label: "Werkspots", id: "werkspots" },
  { icon: Nfc, label: "NFC Badges", id: "nfc" },
];

export default function LocationSidebar({ onLogout }) {
  return (
    <TooltipProvider>
      <aside className="fixed top-0 left-0 h-screen w-16 flex flex-col items-center py-4 z-50" style={{ backgroundColor: "#0c1f36" }}>
        <div className="text-white font-bold text-lg mb-6">H</div>
        <nav className="flex-1 flex flex-col items-center gap-2">
          {items.map((item) => (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <item.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          ))}
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