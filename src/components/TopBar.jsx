import React, { useState, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Undo, Redo, Book, UserPlus, Ghost,
  Settings, Download, Shield, Swords, FileUp, Skull, Camera, Plus, Layout, RotateCcw, LayoutDashboard,
  Lock, Unlock, Palette
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TacticalAlertStack from './TacticalAlertStack';
import { useToast } from './toastContext';
import { cn } from './entity-card/entityCardUtils';
import { useWorkspace } from './workspace/workspaceContext';

const THEME_OPTIONS = [
  { id: 'dragon-glass', label: 'Dragon Glass' },
  { id: 'simple-utility', label: 'Simple Utility' },
  { id: 'sketchbook', label: 'Sketchbook' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'starfleet', label: 'Starfleet' }
];

/**
 * TOP BAR: High-level command center for the DM_Hub.
 * Refactored for:
 * - Progressive disclosure on mobile.
 * - FSM-aligned modal triggers.
 * - Consistent design token application.
 */
const TopBar = ({ encounter, toggleRules, toggleBestiary, toggleSnapshots, view, setView, onResetLayout }) => {
  const {
    state, advanceTurn, undo, redo, canUndo, canRedo,
    addEntity, importState, exportState, clearAlert, resolveConcentration, clearEncounter, resetMap
  } = encounter;
  const { showToast } = useToast();
  const { theme, setTheme, layoutLocked, setLayoutLocked } = useWorkspace();
  const [showExport, setShowExport] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
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
          ac: e.isPlayer ? e.ac : undefined
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
    <header className="min-h-20 py-3 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 bg-[var(--color-obsidian-900)] border-b border-white/5 z-40 relative gap-3">
      {/* 1. Branding & Navigation */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-black tracking-[0.15em] text-gradient-ether italic">
            DnDex
          </h1>
          <div className="flex items-center gap-1.5 -mt-1">
             <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
             <span className="text-[7px] font-bold text-slate-600 tracking-[0.3em] uppercase">DM_Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/30 p-1 rounded-xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'list' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
            )}
            title="List View"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('map')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'map' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
            )}
            title="Tactical Map"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('battlemaster')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'battlemaster' ? "bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"
            )}
            title="Battlemaster — Map + Panels"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Round Tracker & Turn Controls */}
      <div className="flex items-center gap-3 md:gap-4 order-3 md:order-none">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Round</span>
          <div className="h-10 px-4 glass-dark flex items-center justify-center rounded-xl border-indigo-500/20 text-lg md:text-xl font-mono font-bold text-indigo-400 shadow-[var(--shadow-glow-ether)]">
            {state.round}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => advanceTurn(-1)} 
            className="p-2 text-slate-500 hover:text-slate-100 transition-colors hover:bg-white/5 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => advanceTurn(1)} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 group"
          >
            <span>Next Action</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 3. Tactical Alerts */}
      <div className="hidden lg:flex flex-1 items-center justify-center h-10 px-8">
         <TacticalAlertStack 
           alerts={state.alerts} 
           clearAlert={clearAlert}
           resolveConcentration={resolveConcentration}
         />
      </div>

      {/* 4. Global Action Hub */}
      <div className="flex items-center gap-2 md:gap-4 justify-end">
        {/* History Controls */}
        <div className="flex bg-black/30 rounded-xl border border-white/5 p-1">
          <button 
            onClick={() => {
              const note = undo();
              if (note) showToast(`Reverted: ${note}`, 'history');
            }} 
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo} 
            className="p-2 hover:bg-white/5 disabled:opacity-20 text-slate-500 transition-colors"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => {
              const note = redo();
              if (note) showToast(`Restored: ${note}`, 'history');
            }} 
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo} 
            className="p-2 hover:bg-white/5 disabled:opacity-20 text-slate-500 transition-colors"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Add Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={cn(
              "p-2.5 rounded-xl transition-all border",
              showQuickAdd ? "bg-indigo-600 border-indigo-400 text-white shadow-lg" : "glass-dark border-white/10 text-indigo-400 hover:bg-indigo-500/10"
            )}
          >
            <Plus className={cn("w-4 h-4 transition-transform", showQuickAdd && "rotate-45")} />
          </button>
          <AnimatePresence>
            {showQuickAdd && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-3 w-48 glass-dark border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
              >
                <button onClick={() => { addEntity(true); setShowQuickAdd(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-3">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> New Hero
                </button>
                <button onClick={() => { addEntity(false); setShowQuickAdd(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-100 flex items-center gap-3">
                  <Ghost className="w-3.5 h-3.5 text-rose-400" /> New Foe
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={() => { toggleBestiary(); setShowQuickAdd(false); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-100 flex items-center gap-3">
                  <Skull className="w-3.5 h-3.5 text-amber-500" /> From Bestiary
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tools Menu */}
        <div className="flex items-center gap-1.5">
          <button onClick={toggleRules} className="p-2.5 glass-dark border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors" title="Rules Reference">
            <Book className="w-4 h-4" />
          </button>
          <button onClick={toggleSnapshots} className="p-2.5 glass-dark border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors" title="Snapshots">
            <Camera className="w-4 h-4" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExport(!showExport)}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                showExport ? "bg-white/10 border-white/20 text-white" : "glass-dark border-white/10 text-slate-500 hover:text-slate-200"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-3 w-56 glass-dark border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
                >
                  {/* Layout & Theme */}
                  <div className="px-3 py-2 border-b border-white/5 mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Layout & Theme</span>
                  </div>
                  <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl cursor-pointer">
                    <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      aria-label="Theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-200 outline-none flex-1"
                    >
                      {THEME_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id} className="bg-slate-900">{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={() => setLayoutLocked((v) => !v)}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-3"
                  >
                    {layoutLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    {layoutLocked ? 'Unlock Layout' : 'Lock Layout'}
                  </button>
                  {onResetLayout && (
                    <button
                      onClick={onResetLayout}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Layout
                    </button>
                  )}
                  <div className="h-px bg-white/5 my-2" />

                  {/* Data Management */}
                  <div className="px-3 py-2 border-b border-white/5 mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Management</span>
                  </div>
                  <button onClick={exportState} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-3">
                    <Download className="w-3.5 h-3.5" /> Archive Campaign
                  </button>
                  <button onClick={() => handleExport('player')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-3">
                    <Swords className="w-3.5 h-3.5" /> Player Handout
                  </button>
                  <div className="h-px bg-white/5 my-2" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                    <FileUp className="w-3.5 h-3.5" /> Upload Session
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const parsed = JSON.parse(ev.target.result);
                          const ok = importState(parsed);
                          if (ok) {
                            showToast('Session restored successfully.', 'info');
                            setShowExport(false);
                          } else {
                            showToast('Invalid encounter schema — check file format.', 'warning', 6000);
                          }
                        } catch {
                          showToast('Failed to parse file — not valid JSON.', 'error', 6000);
                        }
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }} />
                  <button onClick={() => { if(confirm("Purge encounter data?")) clearEncounter(); }} className="w-full text-left px-3 py-2.5 hover:bg-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-3">
                    <Skull className="w-3.5 h-3.5" /> Wipe Encounter
                  </button>
                  <button onClick={() => { if(confirm("Reset map view and tokens?")) resetMap(); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Battlefield
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
