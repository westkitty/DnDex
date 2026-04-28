import React, { useState, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, Undo, Redo, Book, UserPlus, Ghost, 
  Settings, Download, Shield, Swords, FileUp, Skull
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from './ToastProvider';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TopBar = ({ encounter, toggleRules, toggleBestiary, view, setView }) => {
  const { state, advanceTurn, undo, redo, canUndo, canRedo, addEntity, importState, exportState } = encounter;
  const { showToast } = useToast();
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = (type) => {
    let data = { ...state };
    if (type === 'player') {
      data.entities = data.entities
        .filter(e => !e.hidden)
        .map(e => ({
          name: e.name,
          initiative: e.initiative,
          hp: e.isPlayer ? e.hp : (e.hp <= 0 ? 0 : (e.hp <= e.maxHp / 2 ? 'Bloodied' : 'Healthy')),
          isPlayer: e.isPlayer,
          conditions: e.conditions,
          concentration: e.concentration,
          ac: e.isPlayer ? e.ac : undefined,
          dc: e.isPlayer ? e.dc : undefined,
          narrativeNotes: e.isPlayer ? e.narrativeNotes : undefined
        }));
      data.alerts = [];
      data.logs = [];
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encounter-${type}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 bg-[var(--color-obsidian-900)] border-b border-white/5 z-40 relative">
      {/* Branding & Round */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-[0.2em] text-gradient-ether uppercase italic">
            DM HUB
          </h1>
          <div className="flex items-center gap-1.5 -mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[8px] font-bold text-slate-500 tracking-[0.3em] uppercase">Tactical Link Established</span>
          </div>
        </div>

        <div className="h-10 w-px bg-white/5 mx-2" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Round</span>
            <div className="h-10 px-4 glass-dark flex items-center justify-center rounded-xl border-indigo-500/20 text-xl font-mono font-bold text-indigo-400 shadow-[var(--shadow-glow-ether)]">
              {state.round}
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={() => advanceTurn(-1)} 
              className="p-2 text-slate-500 hover:text-slate-100 transition-colors"
              title="Prev Turn"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => advanceTurn(1)} 
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 group"
            >
              Next Action <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="h-10 w-px bg-white/5 mx-2" />

        {/* Alert Marquee */}
        <div className="flex-1 h-10 overflow-hidden relative">
           <AnimatePresence mode="wait">
             {state.alerts.length > 0 ? (
               <motion.div
                 key={state.alerts[0].id}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 className="h-full flex items-center gap-3 px-4"
               >
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                    state.alerts[0].type === 'warning' || state.alerts[0].type === 'concentration' ? "bg-amber-500" : "bg-indigo-500"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap",
                    state.alerts[0].type === 'warning' || state.alerts[0].type === 'concentration' ? "text-amber-500" : "text-indigo-400"
                  )}>
                    {state.alerts[0].message}
                  </span>
                  {state.alerts.length > 1 && (
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                      +{state.alerts.length - 1} more
                    </span>
                  )}
               </motion.div>
             ) : (
               <motion.div
                 key="idle"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="h-full flex items-center gap-3 px-4 opacity-20"
               >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">
                    Sensors Nominal • No Alerts
                  </span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="h-10 w-px bg-white/5 mx-2" />
      </div>

      {/* View & History */}
      <div className="flex items-center gap-6">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              view === 'list' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Tactical List
          </button>
          <button 
            onClick={() => setView('map')}
            className={cn(
              "px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
              view === 'map' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Battle Map
          </button>
        </div>

        <div className="flex bg-black/40 rounded-xl border border-white/5 p-1">
          <button 
            onClick={() => {
              const note = undo();
              if (note) showToast(`Reverted: ${note}`, 'history');
            }} 
            disabled={!canUndo} 
            className="p-2.5 hover:bg-white/5 disabled:opacity-20 text-slate-400 transition-colors"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              const note = redo();
              if (note) showToast(`Restored: ${note}`, 'history');
            }} 
            disabled={!canRedo} 
            className="p-2.5 hover:bg-white/5 disabled:opacity-20 text-slate-400 transition-colors"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="h-10 w-px bg-white/5" />

        <div className="flex items-center gap-3">
          <button 
            onClick={() => addEntity(true)} 
            className="flex items-center gap-2 px-4 py-2.5 glass-dark hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl transition-all group"
          >
            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Hero</span>
          </button>
          <button 
            onClick={() => addEntity(false)} 
            className="flex items-center gap-2 px-4 py-2.5 glass-dark hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl transition-all group"
          >
            <Ghost className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Foe</span>
          </button>
          <button 
            onClick={toggleBestiary} 
            className="flex items-center gap-2 px-4 py-2.5 glass-dark hover:bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl transition-all group shadow-[0_0_15px_rgba(245,158,11,0.1)]"
            title="Open Bestiary"
          >
            <Skull className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Bestiary</span>
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowExport(!showExport)} 
            className={cn(
              "p-3 rounded-xl transition-all",
              showExport ? "bg-white/10 text-white" : "glass hover:bg-white/5 text-slate-400"
            )}
          >
            <Settings className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showExport && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute right-0 top-full mt-4 w-56 glass-dark z-50 rounded-2xl border border-white/10 p-2 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-white/5 mb-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mission Controls</span>
                </div>
                <button onClick={exportState} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors">
                  <Download className="w-4 h-4 text-indigo-400" /> Save Campaign
                </button>
                <button onClick={() => handleExport('player')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors">
                  <Swords className="w-4 h-4 text-rose-400" /> Player Intel
                </button>
                <div className="h-px bg-white/5 my-2" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors">
                  <FileUp className="w-4 h-4 text-emerald-400" /> Load File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => importState(JSON.parse(ev.target.result));
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={toggleRules} 
          className="p-3 glass hover:bg-white/5 rounded-xl text-slate-400 transition-all"
          title="Reference Rules"
        >
          <Book className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
