import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Skull, Shield, Zap, Info, ScrollText } from 'lucide-react';
import bestiaryData from '../data/bestiary.json';

const BestiaryModal = ({ onClose, onAdd }) => {
  const [search, setSearch] = useState('');
  const [selectedMonster, setSelectedMonster] = useState(null);

  const filteredMonsters = bestiaryData.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-5xl h-[80vh] glass-dark rounded-[2rem] border border-white/10 flex overflow-hidden shadow-2xl shadow-black/50"
      >
        {/* Sidebar: List */}
        <div className="w-80 border-r border-white/5 flex flex-col bg-black/20">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-black tracking-widest text-dragon-400 uppercase italic mb-4 flex items-center gap-3">
              <ScrollText className="w-6 h-6 text-indigo-400" />
              Bestiary
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search monsters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredMonsters.map(monster => (
              <button
                key={monster.name}
                onClick={() => setSelectedMonster(monster)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex flex-col gap-1 ${
                  selectedMonster?.name === monster.name 
                    ? 'bg-indigo-500/20 border border-indigo-500/30 ring-1 ring-indigo-500/20' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="font-bold text-slate-100">{monster.name}</span>
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  <span>{monster.type}</span>
                  <span className="text-dragon-500">CR {monster.cr}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Details */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-transparent to-indigo-500/5">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>

          {selectedMonster ? (
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-black text-slate-100 mb-2 italic tracking-tight">{selectedMonster.name}</h1>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
                    {selectedMonster.size} {selectedMonster.type}, {selectedMonster.alignment}
                  </p>
                </div>
                <button 
                  onClick={() => onAdd(selectedMonster)}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-3 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Initiate Link
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-dark p-4 rounded-2xl border-white/5 flex flex-col items-center">
                  <Shield className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Armor Class</span>
                  <span className="text-2xl font-mono font-bold text-slate-100">{selectedMonster.ac}</span>
                </div>
                <div className="glass-dark p-4 rounded-2xl border-white/5 flex flex-col items-center">
                  <Skull className="w-5 h-5 text-rose-400 mb-1" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Hit Points</span>
                  <span className="text-2xl font-mono font-bold text-slate-100">{selectedMonster.hp}</span>
                </div>
                <div className="glass-dark p-4 rounded-2xl border-white/5 flex flex-col items-center">
                  <Zap className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Speed</span>
                  <span className="text-xs font-bold text-slate-100 text-center leading-tight mt-1">{selectedMonster.speed}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-6 gap-2 mb-8 bg-black/30 p-4 rounded-2xl border border-white/5">
                {Object.entries(selectedMonster.stats).map(([stat, val]) => (
                  <div key={stat} className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat}</span>
                    <span className="text-lg font-bold text-slate-100">{val}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({Math.floor((val-10)/2) >= 0 ? '+' : ''}{Math.floor((val-10)/2)})</span>
                  </div>
                ))}
              </div>

              {/* Traits & Actions */}
              <div className="space-y-6">
                {selectedMonster.traits?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                      Traits
                    </h3>
                    <div className="space-y-3">
                      {selectedMonster.traits.map(trait => (
                        <div key={trait.name} className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="font-bold text-slate-100 italic mr-2">{trait.name}.</span>
                          <span className="text-sm text-slate-400 leading-relaxed">{trait.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <div className="w-1 h-3 bg-rose-500 rounded-full" />
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {selectedMonster.actions.map(action => (
                      <div key={action.name} className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="font-bold text-slate-100 italic mr-2">{action.name}.</span>
                        <span className="text-sm text-slate-400 leading-relaxed">{action.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMonster.legendaryActions?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <div className="w-1 h-3 bg-amber-500 rounded-full" />
                      Legendary Actions
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Can take {selectedMonster.legendaryActionsMax} legendary actions, choosing from the options below.</p>
                    <div className="space-y-3">
                      {selectedMonster.legendaryActions.map(action => (
                        <div key={action.name} className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="font-bold text-slate-100 italic mr-2">{action.name}.</span>
                          <span className="text-sm text-slate-400 leading-relaxed">{action.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
              <Skull className="w-20 h-20 mb-4 animate-pulse" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Select a Foe for Tactical Intel</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BestiaryModal;
