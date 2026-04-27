import React, { useState, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, Undo, Redo, Book, UserPlus, Ghost, 
  Settings, Download, Shield, Swords, AlertCircle, X, FileUp, Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from './ToastProvider';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TopBar = ({ encounter, toggleRules, view, setView }) => {
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
      </div>
    </header>
  );
};

export default TopBar;

      <div className="flex items-center gap-2 md:gap-4">
        {/* Map / List Toggle */}
        <div className="flex glass rounded-lg overflow-hidden border-white/5 p-1">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
              view === 'list' ? "bg-indigo-600 text-white shadow-lg" : "text-dragon-400 hover:text-dragon-200"
            )}
          >
            List
          </button>
          <button 
            onClick={() => setView('map')}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
              view === 'map' ? "bg-indigo-600 text-white shadow-lg" : "text-dragon-400 hover:text-dragon-200"
            )}
          >
            Map
          </button>
        </div>

        {state.alerts.filter(a => a.type !== 'concentration').length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-dark/20 border border-warning-base/30 text-warning-light text-xs font-bold animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {state.alerts.filter(a => a.type !== 'concentration')[0].message}
          </div>
        )}

        <div className="flex glass rounded-lg overflow-hidden border-white/5 p-1">
          <button 
            onClick={() => {
              const note = undo();
              if (note) showToast(`Undone: ${note}`, 'history');
            }} 
            disabled={!canUndo} 
            className="p-2 hover:bg-white/5 disabled:opacity-20 transition-colors"
          >
            <Undo className="w-4 h-4" />
          </button>
          <div className="w-px bg-white/5" />
          <button 
            onClick={() => {
              const note = redo();
              if (note) showToast(`Redone: ${note}`, 'history');
            }} 
            disabled={!canRedo} 
            className="p-2 hover:bg-white/5 disabled:opacity-20 transition-colors"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => addEntity(true)} className="p-2.5 glass-dark border hover:border-indigo-500/50 text-indigo-400 rounded-lg hover:shadow-indigo-500/10 transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wide">Player</span>
          </button>
          <button onClick={() => addEntity(false)} className="p-2.5 glass-dark border hover:border-rose-500/50 text-rose-400 rounded-lg hover:shadow-rose-500/10 transition-all flex items-center gap-2">
            <Ghost className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wide">Monster</span>
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setShowExport(!showExport)} className="p-2.5 glass rounded-lg text-dragon-300">
            <Download className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showExport && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-48 glass-dark z-50 rounded-xl border border-white/10 p-2 shadow-2xl"
              >
                <div className="flex justify-between items-center px-3 py-2 border-b border-white/5 mb-1">
                  <span className="text-[10px] font-bold text-dragon-500 uppercase tracking-widest">Encounter Data</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setShowExport(false)} />
                </div>
                <button onClick={exportState} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" /> Full Backup
                </button>
                <button onClick={() => handleExport('player')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-400" /> Player View (Text)
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={handleImportClick} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-emerald-400" /> Import JSON
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={toggleRules} className="p-2.5 glass hover:border-indigo-500/40 rounded-lg text-dragon-300">
          <Book className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
