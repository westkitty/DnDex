import React from 'react';
import { Palette } from 'lucide-react';
import { useWorkspace } from './workspace/workspaceContext';

const OPTIONS = [
  { id: 'dragon-glass', label: 'Dragon Glass' },
  { id: 'simple-utility', label: 'Simple Utility' },
  { id: 'sketchbook', label: 'Sketchbook' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'starfleet', label: 'Starfleet' }
];

const ThemeSelector = () => {
  const { theme, setTheme } = useWorkspace();

  return (
    <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/30 border border-white/10">
      <Palette className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-200 outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.id} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default ThemeSelector;
