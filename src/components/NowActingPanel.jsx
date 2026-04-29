import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Shield, Zap, Minus, Plus, Brain, 
  Skull, Target, ChevronRight, AlertTriangle,
  Flame, Droplet, Wind, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Necrotic', 'Radiant', 'Force', 'Psychic'];

const NowActingPanel = ({ 
  round, 
  activeEntity, 
  advanceTurn, 
  applyDamage, 
  applyHealing, 
  updateEntity,
  spendLegendaryAction,
  spendLegendaryResistance
}) => {
  const [dmgInput, setDmgInput] = useState('');
  const [dmgType, setDmgType] = useState('Slashing');

  if (!activeEntity) {
    return (
      <div className="glass-dark rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 gap-4 border border-white/5">
        <Sparkles className="w-8 h-8 opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Encounter Stalled</span>
      </div>
    );
  }

  const hpPercent = activeEntity.maxHp > 0 ? (activeEntity.hp / activeEntity.maxHp) * 100 : 0;
  const isBloodied = activeEntity.hp <= activeEntity.maxHp / 2;
  const isDead = activeEntity.hp <= 0;

  const handleApplyDamage = () => {
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyDamage(activeEntity.id, val, dmgType);
    setDmgInput('');
  };

  const handleApplyHealing = () => {
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyHealing(activeEntity.id, val);
    setDmgInput('');
  };

  return (
    <motion.div 
      key={`${round}-${activeEntity.id}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Glow Backdrop */}
      <div className={cn(
        "absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000",
        activeEntity.isPlayer ? "bg-indigo-500/20" : "bg-rose-500/20"
      )} />

      {/* Header Info */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
              Round {round}
            </span>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Now Acting
            </span>
          </div>
          <h2 className={cn(
            "text-4xl font-serif font-black tracking-tight",
            activeEntity.isPlayer ? "text-indigo-100" : "text-rose-100"
          )}>
            {activeEntity.name}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center px-4 py-2 glass-dark rounded-2xl border border-white/5 min-w-[60px]">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Init</span>
            <span className="text-xl font-mono font-bold text-indigo-400">{activeEntity.initiative}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 glass-dark rounded-2xl border border-white/5 min-w-[60px]">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AC</span>
            <span className="text-xl font-mono font-bold text-emerald-400">{activeEntity.ac}</span>
          </div>
          {activeEntity.dc && (
            <div className="flex flex-col items-center px-4 py-2 glass-dark rounded-2xl border border-white/5 min-w-[60px]">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DC</span>
              <span className="text-xl font-mono font-bold text-rose-400">{activeEntity.dc}</span>
            </div>
          )}
        </div>
      </div>

      {/* HP Bar */}
      <div className="relative mb-10 space-y-3">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-mono font-black tracking-tighter",
              isDead ? "text-slate-700" : (isBloodied ? "text-rose-400" : "text-emerald-400")
            )}>
              {activeEntity.hp}
            </span>
            <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">/ {activeEntity.maxHp} HP</span>
          </div>
          {activeEntity.tempHp > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase">+{activeEntity.tempHp} Temp HP</span>
            </div>
          )}
        </div>
        <div className="h-4 bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ type: "spring", bounce: 0, duration: 1 }}
            className={cn(
              "h-full rounded-full relative shadow-lg",
              isDead ? "bg-slate-800" : (isBloodied ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-gradient-to-r from-emerald-600 to-emerald-400")
            )}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full opacity-50 overflow-hidden">
               <div className="w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Grid: Conditions, Legendary, Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-3.5 h-3.5 text-indigo-400" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Conditions</h4>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {activeEntity.concentration && (
                <div className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg border border-amber-400 shadow-lg shadow-amber-500/20 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" /> Concentration
                </div>
              )}
              {activeEntity.conditions.map(c => (
                <div key={c} className="px-3 py-1.5 glass-dark text-slate-300 text-[10px] font-black uppercase rounded-lg border border-white/5 shadow-sm">
                  {c}
                </div>
              ))}
              {activeEntity.conditions.length === 0 && !activeEntity.concentration && (
                <span className="text-[10px] text-slate-600 font-bold italic">No active conditions</span>
              )}
            </div>
          </div>

          {/* Legendary Hub */}
          {(activeEntity.legendaryActionsMax > 0 || activeEntity.legendaryResistancesMax > 0) && (
            <div className="grid grid-cols-2 gap-4 p-5 glass-dark rounded-3xl border border-white/5">
              {activeEntity.legendaryActionsMax > 0 && (
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Actions</span>
                  <div className="flex gap-2">
                    {Array.from({ length: activeEntity.legendaryActionsMax }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => i < activeEntity.legendaryActions && spendLegendaryAction(activeEntity.id)}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border-2 transition-all duration-300",
                          i < activeEntity.legendaryActions 
                            ? "bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                            : "bg-black/40 border-white/10 opacity-20"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              {activeEntity.legendaryResistancesMax > 0 && (
                <div className="space-y-3 border-l border-white/5 pl-4">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Resistances</span>
                  <div className="flex gap-2">
                    {Array.from({ length: activeEntity.legendaryResistancesMax }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => i < activeEntity.legendaryResistances && spendLegendaryResistance(activeEntity.id)}
                        className={cn(
                          "w-3.5 h-3.5 rounded border-2 rotate-45 transition-all duration-300",
                          i < activeEntity.legendaryResistances 
                            ? "bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                            : "bg-black/40 border-white/10 opacity-20"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tactical Actions */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Combat Actions</h4>
            </div>
            <div className="flex items-center gap-2 p-1 glass-dark rounded-2xl border border-white/5">
              <input 
                type="number"
                placeholder="0"
                value={dmgInput}
                onChange={(e) => setDmgInput(e.target.value)}
                className="w-16 h-12 bg-transparent text-center font-mono font-bold text-xl outline-none placeholder:text-slate-800"
              />
              <div className="h-8 w-px bg-white/5 mx-2" />
              <select 
                value={dmgType}
                onChange={(e) => setDmgType(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {DAMAGE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
              </select>
              <div className="flex gap-2 ml-auto p-1">
                <button 
                  onClick={handleApplyDamage}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest border border-rose-500/20"
                >
                  <Minus className="w-4 h-4" /> Dmg
                </button>
                <button 
                  onClick={handleApplyHealing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest border border-emerald-500/20"
                >
                  <Plus className="w-4 h-4" /> Heal
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => advanceTurn(1)}
            className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">End {activeEntity.name}'s Turn</span>
            </div>
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Spacebar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NowActingPanel;
