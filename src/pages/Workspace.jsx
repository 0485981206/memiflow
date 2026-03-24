import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Grid, Palette } from 'lucide-react';
import { toast } from 'sonner';
import WorkspaceDialog from '@/components/workspace/WorkspaceDialog';
import { AVAILABLE_ICONS } from '@/lib/workspace-icons';

export default function Workspace() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const data = await base44.auth.updateMe({});
      return JSON.parse(user.workspaces || '[]');
    },
  });

  const handleSave = async (workspace) => {
    const user = await base44.auth.me();
    const current = JSON.parse(user.workspaces || '[]');
    const updated = [...current, { id: Date.now(), ...workspace }];
    await base44.auth.updateMe({ workspaces: JSON.stringify(updated) });
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    setShowDialog(false);
    toast.success('Workspace aangemaakt');
  };

  const handleDelete = async (id) => {
    const user = await base44.auth.me();
    const current = JSON.parse(user.workspaces || '[]');
    const updated = current.filter(w => w.id !== id);
    await base44.auth.updateMe({ workspaces: JSON.stringify(updated) });
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    toast.success('Workspace verwijderd');
  };

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

      <div className="flex justify-end">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Workspace toevoegen
        </Button>
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
          {workspaces.map(ws => {
            const iconDef = AVAILABLE_ICONS.find(i => i.id === ws.icon);
            const IconComponent = iconDef?.component;
            return (
              <Card key={ws.id} className="p-4 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all cursor-pointer group">
                <div className="p-3 bg-muted rounded-lg group-hover:bg-accent/10">
                  {IconComponent && <IconComponent className="w-8 h-8 text-accent" />}
                </div>
                <div className="text-center flex-1">
                  <p className="font-medium text-sm line-clamp-2">{ws.name}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(ws.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showDialog && (
        <WorkspaceDialog onClose={() => setShowDialog(false)} onSave={handleSave} />
      )}
    </div>
  );
}