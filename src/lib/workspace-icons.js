import {
  Grid3x3, Briefcase, Home, Settings, FileText, BarChart3,
  Users, Calendar, Clock, CheckSquare, Zap, Target
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { id: 'grid', label: 'Grid', component: Grid3x3 },
  { id: 'briefcase', label: 'Briefcase', component: Briefcase },
  { id: 'home', label: 'Home', component: Home },
  { id: 'settings', label: 'Settings', component: Settings },
  { id: 'file', label: 'Document', component: FileText },
  { id: 'chart', label: 'Chart', component: BarChart3 },
  { id: 'users', label: 'Users', component: Users },
  { id: 'calendar', label: 'Calendar', component: Calendar },
  { id: 'clock', label: 'Clock', component: Clock },
  { id: 'check', label: 'Tasks', component: CheckSquare },
  { id: 'zap', label: 'Lightning', component: Zap },
  { id: 'target', label: 'Target', component: Target },
];