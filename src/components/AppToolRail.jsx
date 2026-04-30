import React from 'react';
import { Swords, ClipboardList, Minimize2 } from 'lucide-react';
import { useWorkspace } from './workspace/workspaceContext';
import LayoutControls from './workspace/LayoutControls';
import ThemeSelector from './ThemeSelector';

const AppToolRail = ({ minimizedPanels, onRestorePanel, onResetLayout }) => {
  const { mode, setMode } = useWorkspace();

  return (
    <aside className="w-16 h-full border-r border-white/10 bg-black/30 flex flex-col items-center gap-3 py-3" aria-label="Tool Rail">
      <button
        aria-label="Combat"
        title="Combat mode keeps live turn controls visible."
        onClick={() => setMode('combat')}
        className={`p-2 rounded-xl border ${mode === 'combat' ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200' : 'border-white/10 text-slate-500 hover:text-slate-200'}`}
      >
        <Swords className="w-4 h-4" />
      </button>
      <button
        aria-label="Prep"
        title="Prep mode focuses on setup tools before initiative."
        onClick={() => setMode('prep')}
        className={`p-2 rounded-xl border ${mode === 'prep' ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200' : 'border-white/10 text-slate-500 hover:text-slate-200'}`}
      >
        <ClipboardList className="w-4 h-4" />
      </button>

      <div className="w-full px-2 mt-2">
        <ThemeSelector />
      </div>

      <div className="w-full px-2">
        <LayoutControls onResetLayout={onResetLayout} />
      </div>

      <div className="mt-auto flex flex-col gap-2 w-full px-2">
        {Object.entries(minimizedPanels).map(([id, label]) => (
          <button
            key={id}
            aria-label="Restore Panel"
            title="Panel minimized. Restore it from the tool rail."
            onClick={() => onRestorePanel(id)}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Minimize2 className="w-3.5 h-3.5 mx-auto" />
            <span className="block text-[8px] font-black uppercase tracking-tight mt-1">{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default AppToolRail;
