import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Grid, MapPin, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AVAILABLE_ICONS } from '@/lib/workspace-icons';

export default function Workspace() {
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return JSON.parse(user.workspaces || '[]');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Grid className="w-6 h-6 text-accent" />
          Workspaces
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Maak snelle koppelingen naar menu items
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : workspaces.length === 0 ? (
        <Card className="p-12 text-center">
          <Grid className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nog geen workspaces aangemaakt</p>
          <p className="text-xs text-muted-foreground mt-2">Klik op "Workspace toevoegen" om te beginnen</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Link to="/werkspots">
            <Card className="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all cursor-pointer">
              <div className="p-3 bg-muted rounded-lg">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <div className="text-center flex-1">
                <p className="font-medium text-sm">Werkspots</p>
              </div>
            </Card>
          </Link>
          <TijdelijkCard />
          {workspaces.map(ws => {
            const iconDef = AVAILABLE_ICONS.find(i => i.id === ws.icon);
            const IconComponent = iconDef?.component;
            return (
              <Link to={ws.page} key={ws.id}>
                <Card className="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all cursor-pointer">
                  <div className="p-3 bg-muted rounded-lg">
                    {IconComponent && <IconComponent className="w-8 h-8 text-accent" />}
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-medium text-sm line-clamp-2">{ws.name}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TijdelijkCard() {
  const { data: count = 0 } = useQuery({
    queryKey: ['tijdelijk-badge'],
    queryFn: async () => {
      const res = await base44.functions.invoke('tijdelijkeWerknemer', { action: 'list_all' });
      const records = res.data.records || [];
      return records.filter(r => r.status !== 'gekoppeld').length;
    },
    refetchInterval: 15000,
  });

  return (
    <Link to="/tijdelijke-werknemers">
      <Card className="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all cursor-pointer relative">
        {count > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
        <div className="p-3 bg-muted rounded-lg">
          <UserPlus className="w-8 h-8 text-accent" />
        </div>
        <div className="text-center flex-1">
          <p className="font-medium text-sm">Tijdelijke werknemers</p>
        </div>
      </Card>
    </Link>
  );
}