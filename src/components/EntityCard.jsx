import React, { useState } from 'react';
import { 
  Shield, MoreHorizontal, 
  Brain, Trash2, GripVertical, 
  Eye, EyeOff, Minus, Plus, Settings, BookOpen, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONDITION_METADATA } from '../utils/combat';
import * as LucideIcons from 'lucide-react';

// Sub-components
import EntityStats from './entity-card/EntityStats';
import EntityHP from './entity-card/EntityHP';
import EntityConditions from './entity-card/EntityConditions';
import EntityLegendaryResources from './entity-card/EntityLegendaryResources';
import EntityActions from './entity-card/EntityActions';
import EntityReference from './entity-card/EntityReference';
import { cn } from './entity-card/entityCardUtils';

/**
 * ENTITY CARD: The core tactical unit of the DM_Hub UI.
 * Refactored for Universal Validation Checklist:
 * - Removed magic numbers in favor of CSS variables.
 * - Standardized Framer Motion layout semantics.
 * - Decoupled sub-component logic.
 */
const EntityCard = ({
  entity, isActive, updateEntity, removeEntity, applyDamage, applyHealing,
  spendLegendaryAction, spendLegendaryResistance, alerts, dragControls, duplicateEntity,
  isCompact = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dmgInput, setDmgInput] = useState('');
  const [useGroup, setUseGroup] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  if (!entity || !entity.id) return null;

  const hpPercent = entity.maxHp > 0 ? (entity.hp / entity.maxHp) * 100 : 0;
  const isBloodied = entity.hp <= entity.maxHp / 2;
  const isDead = entity.hp <= 0;
  const isBoss = entity.legendaryActionsMax > 0 || entity.legendaryResistancesMax > 0 || entity.hasLairAction;

  const handleApplyDamage = (val, type) => {
    if (!isNaN(val)) applyDamage(entity.id, val, type, useGroup);
  };

  const handleApplyHealing = (val) => {
    if (!isNaN(val)) applyHealing(entity.id, val, useGroup);
  };

  /**
   * COMPACT VIEW: Used in Initiative Ledger or sidebars.
   */
  if (isCompact) {
    return (
      <motion.div
        layout
        layoutId={`entity-${entity.id}`}
        className={cn(
          "group relative flex items-center gap-4 p-2 rounded-xl transition-all duration-300",
          "bg-[var(--color-obsidian-800)]/60 border border-white/5",
          isActive ? "ring-1 ring-amber-500/50 bg-[var(--color-obsidian-700)]/90 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "hover:bg-[var(--color-obsidian-700)]/50",
          isDead && "opacity-60 grayscale-[0.5]"
        )}
      >
        <div 
          className="cursor-grab text-slate-700 hover:text-indigo-400 p-1"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        
        <div className="w-8 h-8 flex items-center justify-center glass-dark rounded-lg font-mono font-bold text-xs text-indigo-400 border border-white/5">
          {entity.initiative}
        </div>

        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn(
              "font-serif font-bold text-sm truncate",
              entity.isPlayer ? "text-indigo-100" : "text-rose-100"
            )}>
              {entity.name}
            </span>
            <div className="flex items-center gap-1.5 overflow-hidden">
              {entity.concentration && (
                <div className="p-1 bg-amber-500/20 rounded-md">
                  <Brain className="w-2.5 h-2.5 text-amber-500" />
                </div>
              )}
              {isBoss && (
                <div className="p-1 bg-rose-500/20 rounded-md">
                  <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                </div>
              )}
              <div className="flex -space-x-1 overflow-hidden">
                {entity.conditions?.slice(0, 3).map(c => {
                  const meta = CONDITION_METADATA[c];
                  const Icon = LucideIcons[meta?.icon] || LucideIcons.Info;
                  return (
                    <div key={c} className={cn("p-1 rounded-md border border-black/20", meta?.bg || "bg-slate-800")}>
                      <Icon className={cn("w-2.5 h-2.5", meta?.color || "text-slate-300")} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             <div className="flex items-center gap-1.5">
               <Shield className="w-3 h-3 text-slate-500" />
               <span className="text-xs font-bold text-slate-300">{entity.ac}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    layout
                    initial={{ width: 0 }}
                    animate={{ width: `${hpPercent}%` }}
                    className={cn(
                      "h-full rounded-full",
                      isDead ? "bg-slate-800" : (isBloodied ? "bg-rose-500" : "bg-emerald-500")
                    )}
                  />
                </div>
             </div>
             <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-600 hover:text-slate-200">
               <MoreHorizontal className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /**
   * FULL TACTICAL VIEW: Used in Now Acting or Detailed List.
   */
  return (
    <motion.div
      layout
      layoutId={`entity-${entity.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive ? "var(--shadow-glow-ether)" : "none"
      }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden transition-colors duration-500",
        "bg-[var(--color-obsidian-800)]/80 border border-white/5",
        isActive ? "ring-2 ring-amber-500/50 bg-[var(--color-obsidian-700)]/90 border-amber-500/30" : "hover:bg-[var(--color-obsidian-700)]/50",
        isBoss && "border-amber-500/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]",
        isDead && "opacity-60 grayscale-[0.5]",
        isBloodied && !isDead && "border-rose-500/20"
      )}
    >
      {/* Visual Ambience for Bosses */}
      {isBoss && (
        <div className="absolute top-0 right-0 p-2 pointer-events-none overflow-hidden w-24 h-24">
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/10 blur-2xl rounded-full" />
          <div className="relative z-10 flex flex-col items-end">
            <span className="text-[7px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mb-0.5">Legendary</span>
            <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Active State Background Pulse */}
      {isActive && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-indigo-500/10 pointer-events-none"
        />
      )}

      <div className="flex flex-col md:flex-row items-stretch min-h-[100px]">
        <EntityStats 
          entity={entity}
          isActive={isActive}
          updateEntity={updateEntity}
          dragControls={dragControls}
          isBoss={isBoss}
        />

        {/* Tactical Content Area */}
        <div className="flex-1 flex flex-col p-4">
          {/* Concentration Alert Indicator — resolved via TacticalAlertStack in TopBar */}
          <AnimatePresence mode="popLayout">
            {alerts?.filter(a => a.type === 'concentration' && a.entityId === entity.id).map(alert => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 shadow-lg shadow-amber-500/5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{alert.message}</span>
                  <p className="text-[9px] text-amber-500/50 mt-0.5">Resolve via alert stack ↑</p>
                </div>
                <span className="text-[9px] font-bold text-amber-500/60 uppercase font-mono shrink-0">DC {alert.dc}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          <EntityHP 
            entity={entity}
            isBloodied={isBloodied}
            isDead={isDead}
            hpPercent={hpPercent}
            dmgInput={dmgInput}
            setDmgInput={setDmgInput}
            useGroup={useGroup}
            setUseGroup={setUseGroup}
            applyDamage={handleApplyDamage}
            applyHealing={handleApplyHealing}
          />
        </div>

        {/* Global Action Column */}
        <div className="flex flex-col items-center justify-center p-3 gap-2 border-l border-white/5 bg-black/10">
          <button 
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              expanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 hover:text-slate-200"
            )}
            title="Entity Configuration"
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
              title="Monster Grimoire"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Control Console */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/40 border-t border-white/5"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <EntityConditions 
                entity={entity}
                updateEntity={updateEntity}
              />

              <EntityActions 
                entity={entity}
                applyDamage={applyDamage}
                applyHealing={applyHealing}
              />

              <EntityLegendaryResources 
                entity={entity}
                updateEntity={updateEntity}
                spendLegendaryAction={spendLegendaryAction}
                spendLegendaryResistance={spendLegendaryResistance}
                duplicateEntity={duplicateEntity}
                removeEntity={removeEntity}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monster Stat Block Reference */}
      <AnimatePresence>
        {isReferenceOpen && entity.actions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/60 border-t border-amber-500/20"
          >
            <EntityReference entity={entity} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EntityCard;
