import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Shield, Zap, Target, CheckCircle2, Circle } from 'lucide-react';
import { DAMAGE_TYPES, calculateFinalDamage } from '../utils/combat';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const GroupDamageSheet = ({ isOpen, onClose, entities, onApply }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [baseAmount, setBaseAmount] = useState('');
  const [damageType, setDamageType] = useState('Slashing');
  const [overrides, setOverrides] = useState({}); // { [id]: { multiplier, save } }

  const toggleEntity = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const setOverride = (id, field, value) => {
    setOverrides(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const results = useMemo(() => {
    const amt = parseInt(baseAmount) || 0;
    return selectedIds.map(id => {
      const entity = entities.find(e => e.id === id);
      const override = overrides[id] || { multiplier: 1, save: 'none' };
      const final = calculateFinalDamage({
        amount: amt,
        type: damageType,
        multiplier: override.multiplier,
        save: override.save
      });
      return { id, name: entity?.name, final, ...override };
    });
  }, [selectedIds, baseAmount, damageType, overrides, entities]);

  const handleApply = () => {
    const damageMap = {};
    results.forEach(r => {
      damageMap[r.id] = r.final;
    });
    onApply(damageMap, damageType, `Area damage: ${baseAmount} ${damageType} to ${selectedIds.length} targets.`);
    onClose();
    setSelectedIds([]);
    setBaseAmount('');
    setOverrides({});
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-12"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-5xl h-full max-h-[800px] glass-dark rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-rose-400" />
                </div>
                Area Damage Resolution
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Atomic multi-target transaction</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Selector */}
            <div className="w-full lg:w-1/3 border-r border-white/5 flex flex-col overflow-hidden">
              <div className="p-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Targets</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(entities.filter(e => !e.isPlayer).map(e => e.id))} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase">All NPCs</button>
                  <button onClick={() => setSelectedIds([])} className="text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase">Clear</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {entities.map(entity => (
                  <button
                    key={entity.id}
                    onClick={() => toggleEntity(entity.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                      selectedIds.includes(entity.id) 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white" 
                        : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                    )}
                  >
                    {selectedIds.includes(entity.id) ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <Circle className="w-4 h-4 text-slate-700" />}
                    <div className="flex-1 text-left">
                      <div className="text-xs font-bold">{entity.name}</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">HP {entity.hp}/{entity.maxHp} • AC {entity.ac}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Controls & Results */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Global Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Base Damage</label>
                    <input 
                      type="number"
                      placeholder="0"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(e.target.value)}
                      className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-slate-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Damage Type</label>
                    <select 
                      value={damageType}
                      onChange={(e) => setDamageType(e.target.value)}
                      className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase tracking-widest"
                    >
                      {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Per-Target Resolvers */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3" /> Target Specifics
                  </h3>
                  {results.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-700">
                      <Target className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No targets selected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {results.map(r => (
                        <div key={r.id} className="glass-dark rounded-2xl border border-white/5 p-4 flex flex-wrap items-center gap-4">
                          <div className="flex-1 min-w-[150px] overflow-hidden">
                            <div className="text-xs font-black text-white truncate">{r.name}</div>
                            <div className="text-[10px] font-bold text-rose-400 mt-1">-{r.final} {damageType.toLowerCase()}</div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                              {[
                                { label: 'Fail', val: 'none' },
                                { label: 'Pass', val: 'success' }
                              ].map(s => (
                                <button
                                  key={s.label}
                                  onClick={() => setOverride(r.id, 'save', s.val)}
                                  className={cn(
                                    "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                                    r.save === s.val ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                              {[
                                { label: 'N', val: 1 },
                                { label: 'R', val: 0.5 },
                                { label: 'V', val: 2 },
                                { label: 'I', val: 0 }
                              ].map(m => (
                                <button
                                  key={m.label}
                                  onClick={() => setOverride(r.id, 'multiplier', m.val)}
                                  className={cn(
                                    "w-8 h-7 flex items-center justify-center text-[9px] font-black uppercase rounded-lg transition-all",
                                    r.multiplier === m.val ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Resolved</span>
              <span className="text-sm font-bold text-white mt-1">{selectedIds.length} targets affected</span>
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={handleApply}
                disabled={selectedIds.length === 0 || !baseAmount}
                className="px-10 py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-20 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-rose-600/30 flex items-center gap-3"
              >
                <Zap className="w-4 h-4 fill-current" />
                Apply Area Damage
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GroupDamageSheet;
