import React, { useState, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, Undo, Redo, Book, UserPlus, Ghost, 
  Settings, Download, Shield, Swords, AlertCircle, X, FileUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from './ToastProvider';

const TopBar = ({ encounter, toggleRules }) => {
  const { state, advanceTurn, undo, redo, canUndo, canRedo, addEntity, importState } = encounter;
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
          // Explicitly stripping hidden DM info
          ac: e.isPlayer ? e.ac : undefined,
          dc: e.isPlayer ? e.dc : undefined,
          narrativeNotes: e.isPlayer ? e.narrativeNotes : undefined
        }));
      data.alerts = [];
      data.logs = []; // Clear logs for player view
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        importState(imported);
      } catch (_err) {
        alert("Invalid JSON file for encounter import.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 glass-dark border-b border-white/10 z-30 flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
            DM HUB
          </h1>
          <span className="text-[10px] font-bold text-dragon-400 tracking-widest uppercase -mt-1">
            Encounter Engine
          </span>
        </div>

        <div className="h-8 w-px bg-white/10 hidden md:block" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-dragon-500 uppercase tracking-tighter">Round</span>
            <div className="h-9 w-9 glass flex items-center justify-center rounded-lg border-indigo-500/30 text-lg font-mono font-bold text-indigo-400">
              {state.round}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button onClick={() => advanceTurn(-1)} className="p-2 interactive-glass rounded-lg text-dragon-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => advanceTurn(1)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95">
              Next Turn <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
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
                <button onClick={() => handleExport('dm')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" /> DM Backup
                </button>
                <button onClick={() => handleExport('player')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-sm flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-400" /> Player View
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
