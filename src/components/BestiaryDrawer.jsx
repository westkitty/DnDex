import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Plus, Info, 
  Shield, Heart, UserPlus, Ghost
} from 'lucide-react';
import bestiary from '../data/bestiary.json';

const BestiaryDrawer = ({ isOpen, onClose, onAddEntity }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  

  const filteredMonsters = useMemo(() => {
    return bestiary.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || m.type === filterType;
      return matchesSearch && matchesType;
    }).slice(0, 50); // Performance cap
  }, [search, filterType]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--color-obsidian-900)] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                    <Ghost className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Tactical Bestiary</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">334 Monsters Indexed</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    autoFocus
                    placeholder="Search monsters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {['All', 'aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental', 'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${
                        filterType === type 
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                          : 'bg-black/20 text-slate-500 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredMonsters.map(monster => (
                <div 
                  key={monster.name}
                  className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-serif font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">{monster.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{monster.size} {monster.type}</span>
                        <span className="text-[9px] font-black text-rose-500/80 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 uppercase">CR {monster.cr}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onAddEntity(monster)}
                      className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl border border-indigo-500/20 transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg border border-white/5">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-300">{monster.ac} AC</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg border border-white/5">
                      <Heart className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-300">{monster.hp} HP</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMonsters.length === 0 && (
                <div className="py-20 text-center">
                  <Info className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                  <p className="text-sm text-slate-500 font-bold">No monsters match your search.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => onAddEntity({ name: 'New Custom Entity', hp: 10, maxHp: 10, ac: 10, isPlayer: false })}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Add Custom Entity
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BestiaryDrawer;
