import React from 'react';
import { Camera, BookOpen, Skull, Archive, Upload, FileDown } from 'lucide-react';
import { useToast } from './toastContext';

const BattlemasterContextDock = ({
  toggleBestiary,
  toggleRules,
  toggleSnapshots,
  exportState,
  importState
}) => {
  const { showToast } = useToast();

  return (
    <div className="h-full p-3 overflow-y-auto scrollbar-custom">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button className="glass-dark rounded-xl p-3 text-left border border-white/10" onClick={toggleBestiary} aria-label="Bestiary">
          <Skull className="w-4 h-4 text-rose-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Bestiary</div>
        </button>
        <button className="glass-dark rounded-xl p-3 text-left border border-white/10" onClick={toggleRules} aria-label="Rules">
          <BookOpen className="w-4 h-4 text-indigo-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Rules</div>
        </button>
        <button className="glass-dark rounded-xl p-3 text-left border border-white/10" onClick={toggleSnapshots} aria-label="Snapshots">
          <Camera className="w-4 h-4 text-emerald-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Snapshots</div>
        </button>
        <button className="glass-dark rounded-xl p-3 text-left border border-white/10" onClick={exportState} aria-label="Archive Campaign">
          <Archive className="w-4 h-4 text-amber-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Archive Campaign</div>
        </button>
        <label className="glass-dark rounded-xl p-3 text-left border border-white/10 cursor-pointer" aria-label="Upload Session">
          <Upload className="w-4 h-4 text-cyan-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Upload Session</div>
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const parsed = JSON.parse(String(event.target?.result || '{}'));
                  const ok = importState(parsed);
                  if (ok) {
                    showToast('Session restored successfully.', 'info');
                  } else {
                    showToast('Invalid encounter schema — check file format.', 'warning', 6000);
                  }
                } catch {
                  showToast('Failed to parse file — not valid JSON.', 'error', 6000);
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </label>
        <div className="glass-dark rounded-xl p-3 border border-white/10">
          <FileDown className="w-4 h-4 text-slate-400 mb-1" />
          <div className="text-[10px] font-black uppercase tracking-widest">Notes</div>
          <p className="text-[10px] text-slate-500 mt-1">Use snapshots before major encounter changes.</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-3">Drag panel headers to move workspace panels. Resize panels from their edges or corners.</p>
      <p className="text-[10px] text-slate-500">Reset Layout restores panel positions but does not change encounter data.</p>
      <p className="text-[10px] text-slate-500">Theme changes affect appearance only, not encounter data.</p>
    </div>
  );
};

export default BattlemasterContextDock;
