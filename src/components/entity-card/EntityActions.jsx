import React from 'react';
import { Zap } from 'lucide-react';
import DamageCalculator from '../DamageCalculator';

const EntityActions = ({
  entity,
  applyDamage,
  applyHealing
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Zap className="w-3 h-3" /> Tactical Calculator
      </h4>
      <DamageCalculator 
        currentHp={entity.hp}
        maxHp={entity.maxHp}
        onApplyDamage={(amt, type) => applyDamage(amt, type)}
        onApplyHealing={(amt) => applyHealing(amt)}
      />
    </div>
  );
};

export default EntityActions;
