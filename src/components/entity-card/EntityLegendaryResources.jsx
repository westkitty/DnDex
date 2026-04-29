import React from 'react';
import { Flag, ScrollText, Copy, Trash2 } from 'lucide-react';
import { cn } from './entityCardUtils';

const EntityLegendaryResources = ({
  entity,
  updateEntity,
  spendLegendaryAction,
  spendLegendaryResistance,
  duplicateEntity,
  removeEntity
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-3 h-3 block bg-amber-400 rounded-full animate-pulse" /> Legendary Resources
      </h4>
      <div className="flex flex-col gap-3">
        {entity.legendaryActionsMax > 0 && (
          <div className="p-3 glass-dark rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Legendary Actions</span>
              <span className="text-[9px] font-mono font-bold text-indigo-400">{entity.legendaryActions} / {entity.legendaryActionsMax}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: entity.legendaryActionsMax }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => i < entity.legendaryActions && spendLegendaryAction(entity.id)}
                  className={cn(
                    "flex-1 h-2 rounded-full border transition-all duration-500",
                    i < entity.legendaryActions 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-400 border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]" 
                      : "bg-black/40 border-white/5 opacity-20"
                  )}
                />
              ))}
            </div>
          </div>
        )}
        {entity.legendaryResistancesMax > 0 && (
          <div className="p-3 glass-dark rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Legendary Resistance</span>
              <span className="text-[9px] font-mono font-bold text-rose-400">{entity.legendaryResistances} / {entity.legendaryResistancesMax}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: entity.legendaryResistancesMax }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => i < entity.legendaryResistances && spendLegendaryResistance(entity.id)}
                  className={cn(
                    "flex-1 h-2 rounded-full border transition-all duration-500",
                    i < entity.legendaryResistances 
                      ? "bg-gradient-to-r from-rose-600 to-rose-400 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                      : "bg-black/40 border-white/5 opacity-20"
                  )}
                />
              ))}
            </div>
          </div>
        )}
        <button 
          onClick={() => updateEntity({ hasLairAction: !entity.hasLairAction })}
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border transition-all",
            entity.hasLairAction ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "glass-dark border-white/5 text-slate-500"
          )}
        >
          <div className="flex items-center gap-2">
            <Flag className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Lair Actions</span>
          </div>
          <div className={cn(
            "w-8 h-4 rounded-full relative transition-colors",
            entity.hasLairAction ? "bg-rose-500" : "bg-slate-800"
          )}>
            <div className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
              entity.hasLairAction ? "left-4.5" : "left-0.5"
            )} />
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-white/5">
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
  );
};

export default EntityLegendaryResources;
