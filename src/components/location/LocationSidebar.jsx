import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CircleUserRound, MapPin, ClipboardList, LogOut, UserPlus, Nfc, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const items = [
  { icon: CircleUserRound, label: "Werknemers", id: "home" },
  { icon: MapPin, label: "Werkspots", id: "werkspots" },
  { icon: ClipboardList, label: "Registraties", id: "records" },
  { icon: UserPlus, label: "Tijdelijk", id: "tijdelijk" },
  { icon: Nfc, label: "NFC Badge", id: "nfc" },
];

export default function LocationSidebar({ activePage = "home", onNavigate, onLogout, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (refreshing || !onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    toast({ title: "Vernieuwen gelukt", duration: 1000 });
  };

  return (
    <TooltipProvider>
      <aside className="fixed top-0 left-0 h-screen w-20 flex flex-col items-center py-5 z-50" style={{ backgroundColor: "#0c1f36" }}>
        <div className="text-white font-bold text-xl mb-8">H</div>
        <nav className="flex-1 flex flex-col items-center gap-3">
          {items.map((item) => {
            const isActive = activePage === item.id;
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onNavigate?.(item.id)}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-7 h-7" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-sm font-medium">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        {onRefresh && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors mb-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-7 h-7 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-sm font-medium">Vernieuwen</TooltipContent>
          </Tooltip>
        )}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors mb-3"
            >
              <LogOut className="w-7 h-7" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-sm font-medium">Afmelden</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}