import React from 'react';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { useWorkspace } from './workspaceContext';

const LayoutControls = ({ onResetLayout }) => {
  const { layoutLocked, setLayoutLocked } = useWorkspace();

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={layoutLocked ? 'Unlock Layout' : 'Lock Layout'}
        title={layoutLocked ? 'Unlock Layout' : 'Lock Layout'}
        onClick={() => setLayoutLocked(!layoutLocked)}
        className="px-2 py-1.5 rounded-lg bg-black/30 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5"
      >
        {layoutLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {layoutLocked ? 'Unlock Layout' : 'Lock Layout'}
      </button>
      <button
        aria-label="Reset Layout"
        title="Reset Layout"
        onClick={onResetLayout}
        className="px-2 py-1.5 rounded-lg bg-black/30 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Layout
      </button>
    </div>
  );
};

export default LayoutControls;
