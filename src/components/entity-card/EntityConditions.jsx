import React from 'react';
import { Skull, Shield, Brain } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ConditionPalette from '../ConditionPalette';
import { CONDITION_METADATA } from '../../utils/combat';
import { cn } from './entityCardUtils';

const EntityConditions = ({
  entity,
  updateEntity
}) => {
  return (
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
      </div>

      {entity.effects && entity.effects.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <LucideIcons.Sparkles className="w-3 h-3" /> Active Effects
          </h4>
          <div className="space-y-2">
            {entity.effects.map((effect, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-[10px] font-bold text-emerald-100">{effect.name}</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {effect.duration} Rnds
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
          <Shield className="w-3 h-3" /> Conditions Palette
        </h4>
        <ConditionPalette 
          activeConditions={entity.conditions}
          onToggleCondition={(condition) => {
            const next = entity.conditions.includes(condition) 
              ? entity.conditions.filter(c => c !== condition) 
              : [...entity.conditions, condition];
            updateEntity({ conditions: next });
          }}
        />
      </div>
    </div>
  );
};

export default EntityConditions;
