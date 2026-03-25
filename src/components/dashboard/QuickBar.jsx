import React from "react";
import { Link } from "react-router-dom";
import { Globe, Settings, LayoutGrid, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function QuickBar() {
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

      <div className="ml-1 w-9 h-9 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-xs font-semibold text-accent relative">
        {initials}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
      </div>
    </div>
  );
}