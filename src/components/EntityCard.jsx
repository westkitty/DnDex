import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Shield, Info, MoreHorizontal, Skull, Zap, Droplet, 
  Flame, Wind, Brain, Users, Trash2, ChevronDown, GripVertical, 
  Eye, EyeOff, Minus, Plus, Settings, ScrollText, Swords, Target, User, X, Copy, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Necrotic', 'Radiant', 'Force', 'Psychic'];
const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion'];

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const EntityCard = ({ 
  entity, isActive, isUpcoming, updateEntity, removeEntity, applyDamage, applyHealing, 
  resolveConcentration, spendLegendaryAction, spendLegendaryResistance, alerts, dragControls, duplicateEntity
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dmgInput, setDmgInput] = useState('');
  const [dmgType, setDmgType] = useState('Slashing');
  const [useGroup, setUseGroup] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  if (!entity || !entity.id) return null;

  const hpPercent = entity.maxHp > 0 ? (entity.hp / entity.maxHp) * 100 : 0;
  const isBloodied = entity.hp <= entity.maxHp / 2;
  const isDead = entity.hp <= 0;

  const prevHpRef = useRef(entity.hp);
  const [showDamageFlash, setShowDamageFlash] = useState(false);

  useEffect(() => {
    if (entity.hp < prevHpRef.current) {
      setShowDamageFlash(true);
      const timer = setTimeout(() => setShowDamageFlash(false), 500);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = entity.hp;
  }, [entity?.hp]);

  const handleApplyDamage = (e) => {
    e.stopPropagation();
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyDamage(val, dmgType, useGroup);
    setDmgInput('');
  };

  const handleApplyHealing = (e) => {
    e.stopPropagation();
    const val = parseInt(dmgInput);
    if (!isNaN(val)) applyHealing(val, useGroup);
    setDmgInput('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: showDamageFlash ? [0, -2, 2, -2, 2, 0] : 0,
        boxShadow: isActive ? "var(--shadow-glow-ether)" : "none"
      }}
      className={cn(
        "group relative flex flex-col rounded-2xl transition-all duration-500 overflow-hidden",
        "bg-[var(--color-obsidian-800)]/80 border border-white/5",
        isActive ? "ring-2 ring-indigo-500/50 bg-[var(--color-obsidian-700)]/90" : "hover:bg-[var(--color-obsidian-700)]/50",
        isDead && "opacity-60 grayscale-[0.5]",
        isBloodied && !isDead && "border-rose-500/20"
      )}
    >
      {/* Active Turn Pulse */}
      {isActive && (
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
        />
      )}

      <div className="flex flex-col md:flex-row items-stretch min-h-[100px]">
        {/* Initiative Tab */}
        <div className={cn(
          "flex flex-col items-center justify-center gap-2 p-4 border-r border-white/5",
          isActive ? "bg-indigo-500/10" : "bg-black/20"
        )}>
          <div 
            className="cursor-grab text-slate-600 hover:text-indigo-400 active:cursor-grabbing p-1 transition-colors"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="relative">
            <input 
              type="number"
              value={entity.initiative}
              onChange={(e) => updateEntity({ initiative: parseInt(e.target.value) || 0 })}
              className="w-10 h-10 glass-dark rounded-xl text-center font-mono font-bold text-lg text-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col p-4">
          {/* Tactical Alerts */}
          <AnimatePresence mode="popLayout">
            {alerts.filter(a => a.type === 'concentration').map(alert => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-lg shadow-amber-500/5"
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{alert.message}</span>
                   </div>
                   <span className="text-[9px] font-bold text-amber-500/60 uppercase">DC {alert.dc}</span>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => resolveConcentration(entity.id, true)}
                     className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                   >
                     Pass
                   </button>
                   <button 
                     onClick={() => resolveConcentration(entity.id, false)}
                     className="flex-1 py-1.5 bg-black/40 hover:bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-500/30 transition-all"
                   >
                     Fail
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <input 
                value={entity.name}
                onChange={(e) => updateEntity({ name: e.target.value })}
                className={cn(
                  "bg-transparent font-serif font-bold text-xl outline-none border-b border-transparent focus:border-indigo-500/30 transition-all",
                  entity.isPlayer ? "text-indigo-100" : "text-rose-100"
                )}
              />
              <button 
                onClick={() => updateEntity({ hidden: !entity.hidden })}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  entity.hidden ? "text-amber-500 bg-amber-500/10" : "text-slate-500 hover:text-slate-200"
                )}
              >
                {entity.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 px-3 py-1.5 glass-dark rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <input 
                    type="number"
                    value={entity.ac || 10}
                    onChange={(e) => updateEntity({ ac: parseInt(e.target.value) || 0 })}
                    className="w-5 bg-transparent text-xs font-bold text-slate-200 outline-none"
                  />
                </div>
                {!entity.isPlayer && (
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    <input 
                      type="number"
                      value={entity.dc || 10}
                      onChange={(e) => updateEntity({ dc: parseInt(e.target.value) || 0 })}
                      className="w-5 bg-transparent text-xs font-bold text-slate-200 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HP System */}
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 w-full relative">
              <div className="flex justify-between items-end mb-2 px-1">
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-xl font-bold font-mono",
                    isDead ? "text-slate-600" : (isBloodied ? "text-rose-400" : "text-emerald-400")
                  )}>
                    {entity.hp}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">/ {entity.maxHp} HP</span>
                </div>
                {entity.tempHp > 0 && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    +{entity.tempHp} TMP
                  </span>
                )}
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPercent}%` }}
                  className={cn(
                    "h-full rounded-full relative",
                    isDead ? "bg-slate-800" : (isBloodied ? "bg-rose-500" : "bg-emerald-500")
                  )}
                />
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/5 shadow-inner">
              <input 
                type="number"
                placeholder="0"
                value={dmgInput}
                onChange={(e) => setDmgInput(e.target.value)}
                className="w-12 h-9 bg-transparent text-center font-bold text-sm outline-none placeholder:text-slate-700"
              />
              <div className="flex gap-1 pr-1 border-r border-white/5 mr-1">
                <button onClick={() => setDmgInput(Math.floor(parseInt(dmgInput) / 2 || 0).toString())} className="px-1.5 py-0.5 text-[8px] font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase">1/2</button>
                <button onClick={() => setDmgInput((parseInt(dmgInput) * 2 || 0).toString())} className="px-1.5 py-0.5 text-[8px] font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase">2x</button>
              </div>
              <div className="flex gap-1">
                <button onClick={handleApplyDamage} className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"><Minus className="w-4 h-4" /></button>
                <button onClick={handleApplyHealing} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div className="flex flex-col items-center justify-center p-3 gap-2 border-l border-white/5 bg-black/10">
          <button 
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              expanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 hover:text-slate-200"
            )}
          >
            <Settings className={cn("w-5 h-5 transition-transform duration-500", expanded && "rotate-180")} />
          </button>
          {entity.actions && (
            <button 
              onClick={() => setIsReferenceOpen(!isReferenceOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                isReferenceOpen ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30" : "text-slate-500 hover:text-slate-200"
              )}
              title="Monster Stat Block"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Console */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/40 border-t border-white/5"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Skull className="w-3 h-3" /> Status & Effects
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => updateEntity({ concentration: !entity.concentration })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all border",
                      entity.concentration ? "bg-amber-500 text-black border-amber-400" : "glass-dark text-slate-400 border-white/5 hover:border-white/10"
                    )}
                  >
                    <Brain className="w-3.5 h-3.5" /> Concentration
                  </button>
                  <select 
                    onChange={(e) => { if(e.target.value) {
                      const next = entity.conditions.includes(e.target.value) ? entity.conditions.filter(c => c !== e.target.value) : [...entity.conditions, e.target.value];
                      updateEntity({ conditions: next });
                      e.target.value = '';
                    }}}
                    className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none w-24"
                  >
                    <option value="">+ Cond</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entity.conditions.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/5 text-[9px] font-bold text-slate-300 uppercase">{c}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Combat Resources
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 glass-dark rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Legendary Actions</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: entity.legendaryActionsMax }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => i < entity.legendaryActions && spendLegendaryAction(entity.id)}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full border transition-all",
                            i < entity.legendaryActions ? "bg-indigo-400 border-indigo-300" : "bg-black/40 border-white/5 opacity-30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3 glass-dark rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Resistances</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: entity.legendaryResistancesMax }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => i < entity.legendaryResistances && spendLegendaryResistance(entity.id)}
                          className={cn(
                            "w-2.5 h-2.5 rounded border rotate-45 transition-all",
                            i < entity.legendaryResistances ? "bg-rose-500 border-rose-400" : "bg-black/40 border-white/5 opacity-30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <ScrollText className="w-3 h-3" /> Maintenance
                </h4>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); duplicateEntity(); }}
                    className="flex items-center justify-center gap-2 py-2 glass-dark hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" /> Clone Entity
                  </button>
                  <button 
                    onClick={removeEntity}
                    className="flex items-center justify-center gap-2 py-2 glass-dark hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/5 text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge Entry
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReferenceOpen && entity.actions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/60 border-t border-amber-500/20"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-xl border border-white/5">
                {entity.stats && Object.entries(entity.stats).map(([stat, val]) => (
                  <div key={stat} className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat}</span>
                    <span className="text-sm font-bold text-slate-100">{val}</span>
                    <span className="text-[9px] text-slate-400 font-mono">({Math.floor((val-10)/2) >= 0 ? '+' : ''}{Math.floor((val-10)/2)})</span>
                  </div>
                ))}
              </div>

              {entity.traits?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Special Traits</h5>
                  {entity.traits.map(t => (
                    <div key={t.name} className="text-xs leading-relaxed">
                      <span className="font-bold text-slate-200 italic mr-2">{t.name}.</span>
                      <span className="text-slate-400">{t.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em]">Actions</h5>
                {entity.actions.map(a => (
                  <div key={a.name} className="text-xs leading-relaxed">
                    <span className="font-bold text-slate-200 italic mr-2">{a.name}.</span>
                    <span className="text-slate-400">{a.description}</span>
                  </div>
                ))}
              </div>

              {entity.legendaryActionsList?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Legendary Actions</h5>
                  {entity.legendaryActionsList.map(a => (
                    <div key={a.name} className="text-xs leading-relaxed">
                      <span className="font-bold text-slate-200 italic mr-2">{a.name}.</span>
                      <span className="text-slate-400">{a.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EntityCard;
