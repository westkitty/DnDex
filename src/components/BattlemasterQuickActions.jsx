import React, { useState } from 'react';
import { Minus, Plus, Zap } from 'lucide-react';
import { cn } from './entity-card/entityCardUtils';

const QUICK_CHIPS = [5, 10, 15, 20];

const BattlemasterQuickActions = ({ activeEntity, applyDamage, applyHealing }) => {
  const [amount, setAmount] = useState('');

  const apply = (isHeal) => {
    const val = parseInt(amount);
    if (!val || val <= 0 || !activeEntity) return;
    if (isHeal) applyHealing(activeEntity.id, val);
    else applyDamage(activeEntity.id, val, 'Untyped');
    setAmount('');
  };

  if (!activeEntity) return null;

  return (
    <div className="px-3 py-3 border-t border-white/5 space-y-2 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Quick Strike</span>
      </div>

      {/* Quick value chips */}
      <div className="flex gap-1">
        {QUICK_CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => setAmount(String(chip))}
            className={cn(
              'flex-1 py-1 text-[9px] font-black rounded-lg transition-all',
              amount === String(chip)
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-black/40 text-slate-500 border border-white/5 hover:text-slate-200'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Custom amount + action buttons */}
      <div className="flex gap-1.5">
        <input
          type="number"
          min="0"
          placeholder="—"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(false); }}
          className="w-14 bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/40 text-center"
        />
        <button
          onClick={() => apply(false)}
          disabled={!amount}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600/80 hover:bg-rose-600 disabled:opacity-20 text-white rounded-lg text-[9px] font-black uppercase tracking-tight transition-all active:scale-95"
        >
          <Minus className="w-3 h-3" /> Dmg
        </button>
        <button
          onClick={() => apply(true)}
          disabled={!amount}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-20 text-white rounded-lg text-[9px] font-black uppercase tracking-tight transition-all active:scale-95"
        >
          <Plus className="w-3 h-3" /> Heal
        </button>
      </div>
    </div>
  );
};

export default BattlemasterQuickActions;
