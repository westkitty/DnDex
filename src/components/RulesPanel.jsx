import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, History, ScrollText
} from 'lucide-react';
import ActionLedger from './ActionLedger';
import { RULES_DATABASE } from '../data/rulesDatabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const RulesPanel = ({ encounter, onClose, initialQuery = '' }) => {
  const [activeTab, setActiveTab] = useState(initialQuery ? 'library' : 'ledger'); 
  const [query, setQuery] = useState(initialQuery);
  const { state, clearLogs } = encounter;

  // Sync with initialQuery if it changes (e.g. from Command Palette)
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setActiveTab('library');
    }
  }, [initialQuery]);

  const filtered = useMemo(() => {
    if (!query) return RULES_DATABASE;
    const q = query.toLowerCase();
    return RULES_DATABASE.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q)
    );
  }, [query]);

  const categories = ['Condition', 'Rule'];

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 h-full w-full md:w-[400px] bg-[var(--color-obsidian-950)] border-l border-white/5 z-50 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
             {activeTab === 'library' ? <ScrollText className="w-4 h-4 text-indigo-400" /> : <History className="w-4 h-4 text-rose-400" />}
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Tactical Interface</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 uppercase italic tracking-wider">
            {activeTab === 'library' ? 'Grimoire' : 'Action Log'}
          </h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
          <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 bg-black/10">
        <div className="flex p-1.5 bg-black/40 rounded-[1.25rem] border border-white/5">
          <button 
            onClick={() => setActiveTab('ledger')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded-xl",
              activeTab === 'ledger' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
             Combat Ledger
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded-xl",
              activeTab === 'library' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
             Rules Grimoire
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'library' ? (
            <motion.div 
              key="library"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  placeholder="Filter tactical data..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none space-y-8 pb-10 mask-fade-edge">
                {categories.map(cat => {
                  const items = filtered.filter(i => i.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{cat}s</span>
                         <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid gap-3">
                        {items.map(item => (
                          <div key={item.title} className="p-5 rounded-2xl bg-black/20 border border-white/5 hover:border-indigo-500/20 hover:bg-black/30 transition-all group">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                               <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">{item.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                              {item.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="ledger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden pb-6"
            >
              <ActionLedger 
                logs={state.logs || []} 
                onClear={clearLogs} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-black/20 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Reference Core 5E-v1
           </div>
           <span className="text-[9px] font-bold text-slate-700">SRD-NC-v2.0</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default RulesPanel;
