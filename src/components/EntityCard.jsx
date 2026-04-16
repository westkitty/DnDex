import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Shield, Info, MoreHorizontal, Skull, Zap, Droplet, 
  Flame, Wind, Brain, Users, Trash2, ChevronDown, GripVertical, 
  Eye, EyeOff, Minus, Plus, Settings, ScrollText, Swords, Target
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
  entity, isActive, isUpcoming, updateEntity, removeEntity, applyDamage, applyHealing, dragControls 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dmgInput, setDmgInput] = useState('');
  const [dmgType, setDmgType] = useState('Slashing');
  const [useGroup, setUseGroup] = useState(false);

  // Defensive Guard
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

  const toggleCondition = (cond) => {
    const next = entity.conditions.includes(cond)
      ? entity.conditions.filter(c => c !== cond)
      : [...entity.conditions, cond];
    updateEntity({ conditions: next });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: showDamageFlash ? [0, -4, 4, -4, 4, 0] : 0
      }}
      className={cn(
        "group relative flex flex-col rounded-2xl glass transition-all duration-500 overflow-hidden",
        isActive ? "ring-2 ring-health-base bg-dragon-800/90 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "hover:bg-dragon-900/60",
        isUpcoming && !isActive && "ring-1 ring-white/10 opacity-90",
        isDead && "grayscale-[0.8] opacity-50 contrast-75",
        isBloodied && !isDead && "shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] border-rose-500/20"
      )}
    >
      {/* Visual Feedback Overlays */}
      <AnimatePresence>
        {showDamageFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-500/20 pointer-events-none z-20"
          />
        )}
      </AnimatePresence>

      {/* Active Marker */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ width: 0 }} animate={{ width: 6 }}
            className="absolute left-0 top-0 bottom-0 bg-health-base z-30 shadow-[2px_0_10px_rgba(16,185,129,0.5)]"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-stretch">
        {/* Left: Drag Handle & Initiative */}
        <div className={cn(
          "flex items-center gap-4 p-3 md:p-4 border-b md:border-b-0 md:border-r border-white/5 transition-colors duration-500",
          isActive ? "bg-health-base/5" : ""
        )}>
          <div 
            className="cursor-grab text-dragon-600 hover:text-dragon-300 active:cursor-grabbing p-1"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative group/init">
              <input 
                type="number"
                value={entity.initiative}
                onChange={(e) => updateEntity({ initiative: parseInt(e.target.value) || 0 })}
                className="w-12 h-10 glass bg-dragon-950/50 rounded-lg text-center font-mono font-black text-xl text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              <div className="absolute -inset-1 rounded-lg bg-indigo-500 opacity-0 group-hover/init:opacity-5 blur-sm transition-opacity" />
            </div>
            <span className="text-[9px] font-black text-dragon-500 uppercase tracking-widest mt-1">Init</span>
          </div>
        </div>

        {/* Center: Info Area */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-6 p-3 md:p-4">
          <div className="flex-1 min-w-0 w-full relative">
            <div className="flex items-center gap-2 mb-1.5">
              <input 
                value={entity.name}
                onChange={(e) => updateEntity({ name: e.target.value })}
                className={cn(
                  "bg-transparent font-serif font-bold text-2xl outline-none focus:border-b-2 border-indigo-500/50 truncate w-full transition-all",
                  entity.isPlayer ? "text-indigo-200" : "text-rose-200"
                )}
              />
              <button 
                onClick={() => updateEntity({ hidden: !entity.hidden })}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  entity.hidden ? "text-dragon-500 bg-white/5" : "text-dragon-400 hover:text-white"
                )}
                title="Visibility Toggle"
              >
                {entity.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center glass-dark px-2 py-1 rounded-lg border border-white/5 gap-3">
                <div className="flex items-center gap-1.5 group/stat">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <input 
                    type="number"
                    value={entity.ac || 10}
                    onChange={(e) => updateEntity({ ac: parseInt(e.target.value) || 0 })}
                    className="w-5 bg-transparent text-xs font-black text-dragon-200 outline-none"
                    title="AC"
                  />
                </div>
                <div className="w-px h-3 bg-white/10" />
                {!entity.isPlayer ? (
                  <div className="flex items-center gap-1.5 group/stat">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    <input 
                      type="number"
                      value={entity.dc || 10}
                      onChange={(e) => updateEntity({ dc: parseInt(e.target.value) || 0 })}
                      className="w-5 bg-transparent text-xs font-black text-dragon-200 outline-none"
                      title="DC"
                    />
                  </div>
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {entity.concentration && (
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="px-2.5 py-1 rounded-lg bg-warning-base/10 border border-warning-base/40 text-warning-light text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                  >
                    <Zap className="w-3 h-3 fill-current" /> Concentrating
                  </motion.span>
                )}
                {entity.groupId && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {entity.groupId}
                  </span>
                )}
                {entity.conditions.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-lg bg-dragon-800 border-white/10 border text-dragon-200 text-[10px] font-black uppercase tracking-wider">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* HP Console */}
          <div className="flex flex-col lg:flex-row items-center gap-6 w-full md:w-auto">
            <div className="w-full md:w-40 shrink-0">
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-black font-mono",
                    isDead ? "text-dragon-600" : (isBloodied ? "text-rose-400" : "text-health-base")
                  )}>
                    {entity.hp}
                  </span>
                  <span className="text-[10px] font-black text-dragon-600 uppercase">/ {entity.maxHp}</span>
                </div>
                {entity.tempHp > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/30">
                    +{entity.tempHp}
                  </span>
                )}
              </div>
              <div className="h-2.5 bg-dragon-950/50 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={cn(
                    "h-full rounded-full relative transition-colors duration-500",
                    isDead ? "bg-dragon-800" : (isBloodied ? "bg-rose-600" : "bg-health-base")
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </motion.div>
              </div>
            </div>

            <div className="flex items-stretch glass-dark rounded-xl p-1.5 border border-white/10 shadow-lg gap-1.5">
               <input 
                type="number"
                placeholder="Amt"
                value={dmgInput}
                onChange={(e) => setDmgInput(e.target.value)}
                className="w-14 bg-dragon-900/50 rounded-lg text-center font-black text-sm outline-none placeholder:text-dragon-700 focus:ring-1 focus:ring-white/10 transition-all h-10"
               />
               <div className="relative">
                 <select 
                  value={dmgType}
                  onChange={(e) => setDmgType(e.target.value)}
                  className="bg-dragon-900/50 rounded-lg text-[10px] font-black uppercase tracking-tighter text-dragon-400 outline-none w-24 px-2 h-10 appearance-none border border-transparent focus:border-white/10"
                 >
                   {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-dragon-600" />
               </div>
               <div className="flex gap-1">
                 <button 
                  onClick={handleApplyDamage} 
                  className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all active:scale-90"
                  title="Damage"
                 >
                   <Minus className="w-5 h-5" />
                 </button>
                 <button 
                  onClick={handleApplyHealing} 
                  className="w-10 h-10 flex items-center justify-center bg-health-base/10 hover:bg-health-base text-health-base hover:text-white rounded-lg transition-all active:scale-90"
                  title="Heal"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 p-3 md:p-4 border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.02]">
          <button 
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              expanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "glass-dark text-dragon-400 hover:text-dragon-200"
            )}
          >
            <Settings className={cn("w-5 h-5 transition-transform duration-500", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-dragon-950/40 border-t border-white/5"
          >
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status & Effects */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-dragon-500 uppercase tracking-[0.2em] mb-3">Status Management</h4>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => updateEntity({ concentration: !entity.concentration })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border",
                      entity.concentration ? "bg-warning-base text-dragon-950 border-warning-base" : "glass text-dragon-400 border-white/5"
                    )}
                  >
                    <Brain className="w-4 h-4" /> Concentration
                  </button>

                  <div className="relative group/select">
                    <select 
                      onChange={(e) => { if(e.target.value) toggleCondition(e.target.value); e.target.value = ''; }}
                      className="appearance-none bg-dragon-800 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-dragon-300 outline-none w-32 cursor-pointer pr-8"
                    >
                      <option value="">+ Condition</option>
                      {CONDITIONS.filter(c => !entity.conditions.includes(c)).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dragon-500" />
                  </div>
                </div>

                <div className="space-y-2">
                   <h5 className="text-[10px] font-bold text-dragon-600 uppercase">Active Effects (Auto-tick)</h5>
                   <div className="flex gap-2">
                      <input id={`eff-name-${entity.id}`} placeholder="Spell/Effect" className="flex-1 glass text-xs p-2 rounded-lg outline-none" />
                      <input id={`eff-dur-${entity.id}`} type="number" placeholder="Rnds" className="w-12 glass text-xs p-2 rounded-lg outline-none text-center" />
                      <button 
                        onClick={() => {
                          const name = document.getElementById(`eff-name-${entity.id}`).value;
                          const dur = parseInt(document.getElementById(`eff-dur-${entity.id}`).value);
                          if (name && dur > 0) {
                            updateEntity({ effects: [...entity.effects, { id: Math.random(), name, duration: dur, tickOn: 'start' }] });
                            document.getElementById(`eff-name-${entity.id}`).value = '';
                            document.getElementById(`eff-dur-${entity.id}`).value = '';
                          }
                        }}
                        className="p-2 glass text-indigo-400 rounded-lg"><Plus className="w-4 h-4" /></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {entity.effects.map(ef => (
                       <span key={ef.id} className="glass px-2 py-1 rounded-md text-[10px] flex items-center gap-2 border-indigo-500/20 text-indigo-300">
                         {ef.name} ({ef.duration})
                         <X className="w-3 h-3 cursor-pointer" onClick={() => updateEntity({ effects: entity.effects.filter(e => e.id !== ef.id) })} />
                       </span>
                     ))}
                   </div>
                </div>
              </div>

              {/* Elements & Groups */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-dragon-500 uppercase tracking-[0.2em] mb-3">Mechanical Overrides</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-dragon-600 mb-1">
                    <span>ELEMENTAL AFFINITES</span>
                    <Info className="w-3 h-3" title="Used by the built-in damage calculator" />
                  </div>
                  <ElementalRow label="Resist." arr={entity.resistances} color="text-warning-base" onChange={(next) => updateEntity({ resistances: next })} />
                  <ElementalRow label="Immune" arr={entity.immunities} color="text-health-base" onChange={(next) => updateEntity({ immunities: next })} />
                  <ElementalRow label="Vulner." arr={entity.vulnerabilities} color="text-rose-400" onChange={(next) => updateEntity({ vulnerabilities: next })} />
                </div>

                {!entity.isPlayer && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-dragon-600">BATCH CONTROL & LEGENDARY</span>
                    <div className="flex gap-2">
                      <div className="flex-1 glass flex items-center px-3 rounded-lg border-indigo-500/20">
                        <Users className="w-4 h-4 text-indigo-400 mr-2" />
                        <input 
                          placeholder="Group ID" 
                          value={entity.groupId}
                          onChange={(e) => updateEntity({ groupId: e.target.value })}
                          className="bg-transparent text-xs py-2 w-full outline-none" 
                        />
                      </div>
                      <div className="glass flex items-center px-3 rounded-lg border-amber-500/20" title="Legendary Actions (Current / Max)">
                        <Zap className="w-4 h-4 text-amber-400 mr-2" />
                        <input 
                          type="number"
                          value={entity.legendaryActions}
                          onChange={(e) => updateEntity({ legendaryActions: parseInt(e.target.value) || 0 })}
                          className="bg-transparent text-xs py-2 w-8 text-center outline-none" 
                        />
                        <span className="text-dragon-600 mx-1">/</span>
                        <input 
                          type="number"
                          value={entity.maxLegendaryActions}
                          onChange={(e) => updateEntity({ maxLegendaryActions: parseInt(e.target.value) || 0 })}
                          className="bg-transparent text-xs py-2 w-8 text-center outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Narrative & Maintenance */}
              <div className="space-y-4 flex flex-col">
                <h4 className="text-[10px] font-bold text-dragon-500 uppercase tracking-[0.2em] mb-3">Narrative Tracking</h4>
                
                <textarea 
                  placeholder="Emotional state, current goal, hidden development..."
                  value={entity.narrativeNotes}
                  onChange={(e) => updateEntity({ narrativeNotes: e.target.value })}
                  className="flex-1 glass rounded-xl p-3 text-sm italic text-dragon-300 min-h-[100px] outline-none border-white/5 focus:border-indigo-500/30 transition-colors scrollbar-custom"
                />

                <div className="flex items-center justify-between pt-4 mt-auto">
                   <label className="flex items-center gap-2 cursor-pointer group/chk">
                     <div className={cn(
                       "w-4 h-4 rounded border border-white/20 flex items-center justify-center transition-colors",
                       useGroup ? "bg-indigo-500 border-indigo-500" : "bg-transparent group-hover:border-white/40"
                     )}>
                       {useGroup && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                     </div>
                     <input type="checkbox" className="hidden" checked={useGroup} onChange={() => setUseGroup(!useGroup)} />
                     <span className="text-[10px] font-bold text-dragon-500 uppercase">Apply to Batch Group</span>
                   </label>

                   <button 
                    onClick={removeEntity}
                    className="flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all"
                   >
                     <Trash2 className="w-4 h-4" /> Delete
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ElementalRow = ({ label, arr, color, onChange }) => {
  return (
    <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border-white/5">
      <span className={cn("text-[10px] font-bold uppercase w-14", color)}>{label}</span>
      <div className="flex flex-wrap gap-1 flex-1">
        {arr.map(t => (
          <span key={t} className="bg-dragon-800 text-dragon-400 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 group/chip">
            {t}
            <X className="w-2 h-2 cursor-pointer hover:text-rose-400" onClick={() => onChange(arr.filter(x => x !== t))} />
          </span>
        ))}
        <select 
          onChange={(e) => { if(e.target.value) onChange([...new Set([...arr, e.target.value])]); e.target.value = ''; }}
          className="bg-transparent text-[8px] font-bold text-dragon-500 outline-none w-12 cursor-pointer"
        >
          <option value="">+ Add</option>
          {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
};

export default EntityCard;
