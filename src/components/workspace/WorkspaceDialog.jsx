import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_ICONS } from '@/lib/workspace-icons';

const PAGES = [
  { label: "Dashboard", value: "/" },
  { label: "Werknemers", value: "/werknemers" },
  { label: "Eindklanten", value: "/eindklanten" },
  { label: "Plaatsingen", value: "/plaatsingen" },
  { label: "Kalender", value: "/prestaties/kalender" },
  { label: "Kalenderoverzicht", value: "/prestaties/kalenderoverzicht" },
  { label: "Overzicht", value: "/prestaties/overzicht" },
  { label: "Codes", value: "/prestaties/codes" },
  { label: "PDF Import", value: "/prestaties/import" },
  { label: "Records", value: "/prestaties/records" },
  { label: "Loonfiches", value: "/loonfiches" },
  { label: "Rapporten", value: "/rapporten" },
  { label: "Instellingen", value: "/instellingen" },
  { label: "Acerta Kalender", value: "/acerta/kalender" },
];

export default function WorkspaceDialog({ onClose, onSave, initialData }) {
  const [form, setForm] = useState(initialData || { name: '', icon: 'grid', page: '/' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name.trim()) {
      onSave({ name: form.name, icon: form.icon, page: form.page });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Workspace bewerken' : 'Workspace aanmaken'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Naam</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bijv. Sales Team"
              autoFocus
            />
          </div>

          <div>
            <Label>Pagina</Label>
            <Select value={form.page} onValueChange={(page) => setForm({ ...form, page })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {PAGES.map(page => (
                  <SelectItem key={page.value} value={page.value}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-3 block">Icoon selecteren</Label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map(icon => {
                const IconComponent = icon.component;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setForm({ ...form, icon: icon.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      form.icon === icon.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                    title={icon.label}
                  >
                    <IconComponent className="w-5 h-5 mx-auto text-accent" />
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!form.name.trim()}>
              Aanmaken
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}