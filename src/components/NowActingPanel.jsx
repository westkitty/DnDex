import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Shield, Zap, Minus, Plus, Brain, 
  Skull, Target, ChevronRight, AlertTriangle,
  Flame, Droplet, Wind, Sparkles, Users
} from 'lucide-react';
import { cn } from './entity-card/entityCardUtils';
import EntityConditions from './entity-card/EntityConditions';

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Necrotic', 'Radiant', 'Force', 'Psychic'];

/**
 * NOW ACTING PANEL: The focused view for the current entity in the initiative order.
 * Refactored for:
 * - Group targeting support.
 * - Standardized design tokens.
 * - Reactive visual feedback.
 */
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
  const [useGroup, setUseGroup] = useState(false);

  if (!activeEntity) {
    return (
      <div className="glass-dark rounded-[2rem] p-12 flex flex-col items-center justify-center text-slate-600 gap-6 border border-white/5 border-dashed">
        <Sparkles className="w-10 h-10 opacity-10" />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[12px] font-black uppercase tracking-[0.4em]">Awaiting Combat</span>
          <span className="text-[10px] font-bold opacity-40">No active turn detected in temporal stream.</span>
        </div>
      </div>
    );
  }

  const hpPercent = activeEntity.maxHp > 0 ? (activeEntity.hp / activeEntity.maxHp) * 100 : 0;
  const isBloodied = activeEntity.hp <= activeEntity.maxHp / 2;
  const isDead = activeEntity.hp <= 0;

  const handleApplyDamage = () => {
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyDamage(activeEntity.id, val, dmgType, useGroup);
    setDmgInput('');
  };

  const handleApplyHealing = () => {
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyHealing(activeEntity.id, val, useGroup);
    setDmgInput('');
  };

  return (
    <motion.div 
      key={`${round}-${activeEntity.id}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Background Ambience */}
      <div className={cn(
        "absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[120px] transition-colors duration-1000",
        activeEntity.isPlayer ? "bg-indigo-500/10" : "bg-rose-500/10"
      )} />

      {/* Header Context */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Round</span>
               <span className="text-[10px] font-bold text-indigo-400 font-mono">{round}</span>
            </div>
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              Now Acting
            </motion.div>
          </div>
          <h2 className={cn(
            "text-4xl md:text-5xl font-serif font-black tracking-tight",
            activeEntity.isPlayer ? "text-indigo-50" : "text-rose-50"
          )}>
            {activeEntity.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <StatBlock label="Initiative" value={activeEntity.initiative} color="indigo" />
          <StatBlock label="Armor Class" value={activeEntity.ac} color="emerald" />
          {activeEntity.dc && <StatBlock label="Spell DC" value={activeEntity.dc} color="rose" />}
        </div>
      </div>

      {/* Health Console */}
      <div className="relative mb-12 space-y-4">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-baseline gap-3">
            <motion.span 
              layoutId={`hp-${activeEntity.id}`}
              className={cn(
                "text-6xl font-mono font-black tracking-tighter",
                isDead ? "text-slate-700" : (isBloodied ? "text-rose-400" : "text-emerald-400")
              )}
            >
              {activeEntity.hp}
            </motion.span>
            <span className="text-base font-bold text-slate-600 uppercase tracking-[0.2em]">/ {activeEntity.maxHp} <span className="text-[10px]">Vitality</span></span>
          </div>
          {activeEntity.tempHp > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">+{activeEntity.tempHp} Ward</span>
            </div>
          )}
        </div>
        <div className="h-4 bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ type: "spring", bounce: 0, duration: 1.2 }}
            className={cn(
              "h-full rounded-full relative shadow-[0_0_20px_rgba(0,0,0,0.5)]",
              isDead ? "bg-slate-800" : (isBloodied ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-gradient-to-r from-emerald-600 to-emerald-400")
            )}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full opacity-30 overflow-hidden">
               <div className="w-full h-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Status & Resources */}
        <div className="space-y-8">
          <section className="space-y-4">
             <EntityConditions 
               entity={activeEntity}
               updateEntity={(updates) => updateEntity(activeEntity.id, updates)}
             />
          </section>

          {(activeEntity.legendaryActionsMax > 0 || activeEntity.legendaryResistancesMax > 0) && (
            <section className="p-6 glass-dark rounded-[2rem] border border-white/10 shadow-xl space-y-6">
              <header className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em]">Legendary Resonance</h4>
              </header>
              <div className="grid grid-cols-2 gap-8">
                {activeEntity.legendaryActionsMax > 0 && (
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Actions</span>
                    <div className="flex gap-2.5">
                      {Array.from({ length: activeEntity.legendaryActionsMax }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => i < activeEntity.legendaryActions && spendLegendaryAction(activeEntity.id)}
                          className={cn(
                            "w-4 h-4 rounded-full border-2 transition-all duration-500",
                            i < activeEntity.legendaryActions 
                              ? "bg-indigo-500 border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.6)]" 
                              : "bg-black/40 border-white/10 opacity-10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {activeEntity.legendaryResistancesMax > 0 && (
                  <div className="space-y-4 border-l border-white/5 pl-8">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Resistances</span>
                    <div className="flex gap-2.5">
                      {Array.from({ length: activeEntity.legendaryResistancesMax }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => i < activeEntity.legendaryResistances && spendLegendaryResistance(activeEntity.id)}
                          className={cn(
                            "w-4 h-4 rounded border-2 rotate-45 transition-all duration-500",
                            i < activeEntity.legendaryResistances 
                              ? "bg-rose-500 border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]" 
                              : "bg-black/40 border-white/10 opacity-10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Tactical Console */}
        <div className="space-y-8">
           <section className="space-y-4">
             <header className="flex items-center gap-2 px-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tactical Interface</h4>
             </header>
             <div className="flex items-center gap-3 p-2 glass-dark rounded-[1.5rem] border border-white/10 shadow-inner">
                {activeEntity.groupId && (
                  <button 
                    onClick={() => setUseGroup(!useGroup)}
                    className={cn(
                      "p-3.5 rounded-xl transition-all border",
                      useGroup ? "bg-indigo-600 border-indigo-400 text-white shadow-lg" : "bg-white/5 border-transparent text-slate-600"
                    )}
                    title="Target Group"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}
                <input 
                  type="number"
                  placeholder="0"
                  value={dmgInput}
                  onChange={(e) => setDmgInput(e.target.value)}
                  className="w-20 h-14 bg-transparent text-center font-mono font-black text-2xl outline-none placeholder:text-slate-800"
                />
                <div className="h-10 w-px bg-white/5" />
                <select 
                  value={dmgType}
                  onChange={(e) => setDmgType(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {DAMAGE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
                <div className="flex gap-2 ml-auto">
                  <button 
                    onClick={handleApplyDamage}
                    className="flex flex-col items-center justify-center w-16 h-14 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20 active:scale-90"
                  >
                    <Minus className="w-4 h-4 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Dmg</span>
                  </button>
                  <button 
                    onClick={handleApplyHealing}
                    className="flex flex-col items-center justify-center w-16 h-14 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-500/20 active:scale-90"
                  >
                    <Plus className="w-4 h-4 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Heal</span>
                  </button>
                </div>
             </div>
           </section>

           <button 
            onClick={() => advanceTurn(1)}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Finalize Action</span>
                <span className="text-sm font-black uppercase tracking-wider italic text-indigo-50">End {activeEntity.name}'s Sequence</span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-black/20 rounded-lg text-[9px] font-black opacity-60 uppercase tracking-widest border border-white/5">
              Spacebar
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const StatBlock = ({ label, value, color }) => {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/5 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/5 border-rose-500/20"
  };

  return (
    <div className={cn("flex flex-col items-center px-5 py-3 glass-dark rounded-2xl border min-w-[80px]", colors[color])}>
      <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</span>
      <span className="text-2xl font-mono font-black">{value}</span>
    </div>
  );
};

export default NowActingPanel;
