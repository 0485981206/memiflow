import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Settings, LayoutGrid, Bell, Bot, LogOut, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BaciChatPanel from "./BaciChatPanel";

export default function QuickBar() {
  const [baciOpen, setBaciOpen] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pendingCount"],
    queryFn: async () => {
      const items = await base44.entities.Prestatie.filter({ status: "ingevoerd" });
      return items.length;
    },
  });

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" asChild>
        <Link to="/workspace">
          <Globe className="w-[18px] h-[18px]" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" asChild>
        <Link to="/instellingen">
          <Settings className="w-[18px] h-[18px]" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" asChild>
        <Link to="/workspace">
          <LayoutGrid className="w-[18px] h-[18px]" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative" asChild>
        <Link to="/prestaties/records">
          <Bell className="w-[18px] h-[18px]" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
        onClick={() => setBaciOpen(!baciOpen)}
        title="Chat met Baci"
      >
        <Bot className="w-[18px] h-[18px]" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 w-9 h-9 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-xs font-semibold text-accent relative cursor-pointer hover:border-accent/50 transition-colors">
            {initials}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.full_name || "Gebruiker"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/instellingen" className="cursor-pointer">
              <User className="w-4 h-4 mr-2" /> Profiel
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Uitloggen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BaciChatPanel open={baciOpen} onClose={() => setBaciOpen(false)} />
    </div>
  );
}