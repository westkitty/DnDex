import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Skull, Book, Zap, Undo, Redo, Plus, UserPlus, Ghost, X, Target } from 'lucide-react';
import bestiaryData from '../data/bestiary.json';
import { RULES_DATABASE } from './RulesPanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CommandPalette = ({ isOpen, onClose, encounter, setView, toggleBestiary, toggleRules }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'next', name: 'Next Turn', icon: <Zap className="w-4 h-4" />, action: () => encounter.advanceTurn(1), category: 'System' },
    { id: 'prev', name: 'Previous Turn', icon: <Undo className="w-4 h-4" />, action: () => encounter.advanceTurn(-1), category: 'System' },
    { id: 'undo', name: 'Undo Last Action', icon: <Undo className="w-4 h-4" />, action: () => encounter.undo(), category: 'System' },
    { id: 'redo', name: 'Redo Action', icon: <Redo className="w-4 h-4" />, action: () => encounter.redo(), category: 'System' },
    { id: 'add-hero', name: 'Add Hero', icon: <UserPlus className="w-4 h-4" />, action: () => encounter.addEntity(true), category: 'System' },
    { id: 'add-foe', name: 'Add Foe', icon: <Ghost className="w-4 h-4" />, action: () => encounter.addEntity(false), category: 'System' },
    { id: 'view-map', name: 'Switch to Battle Map', icon: <Target className="w-4 h-4" />, action: () => setView('map'), category: 'Navigation' },
    { id: 'view-list', name: 'Switch to Tactical List', icon: <Command className="w-4 h-4" />, action: () => setView('list'), category: 'Navigation' },
    { id: 'open-bestiary', name: 'Open Bestiary', icon: <Skull className="w-4 h-4" />, action: () => toggleBestiary(), category: 'Navigation' },
    { id: 'open-rules', name: 'Open Rules Grimoire', icon: <Book className="w-4 h-4" />, action: () => toggleRules(), category: 'Navigation' },
  ];

  const results = useMemo(() => {
    if (!query) return actions.map(a => ({ ...a, type: 'action' }));

    const q = query.toLowerCase();
    
    const filteredActions = actions.filter(a => a.name.toLowerCase().includes(q))
      .map(a => ({ ...a, type: 'action' }));

    const filteredMonsters = bestiaryData.filter(m => m.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(m => ({ 
        id: `monster-${m.name}`, 
        name: `Bestiary: ${m.name}`, 
        icon: <Skull className="w-4 h-4 text-rose-400" />, 
        action: () => encounter.addEntityFromTemplate(m),
        category: 'Bestiary',
        type: 'monster'
      }));

    const filteredRules = RULES_DATABASE.filter(r => r.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(r => ({
        id: `rule-${r.title}`,
        name: `Rule: ${r.title}`,
        icon: <Book className="w-4 h-4 text-indigo-400" />,
        action: () => toggleRules(r.title), // Pass title to highlight
        category: 'Rules',
        type: 'rule'
      }));

    return [...filteredActions, ...filteredMonsters, ...filteredRules];
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl glass-dark rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/20">
          <Search className="w-5 h-5 text-indigo-400" />
          <input 
            autoFocus
            placeholder="Search monsters, rules, and actions... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-100 placeholder:text-slate-600"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {results.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-600">
               <Search className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">No intelligence found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    result.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left",
                    index === selectedIndex 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1" 
                      : "hover:bg-white/5 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    index === selectedIndex ? "bg-white/20" : "bg-black/40"
                  )}>
                    {result.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{result.name}</div>
                    <div className={cn(
                      "text-[10px] font-black uppercase tracking-widest mt-0.5",
                      index === selectedIndex ? "text-indigo-200" : "text-slate-600"
                    )}>
                      {result.category}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                       Execute <Plus className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                 <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↑↓</span> Navigate
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                 <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</span> Select
              </div>
           </div>
           <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              DnDex Tactical Palette v1.0
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;
