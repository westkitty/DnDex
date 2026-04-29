import React, { useState, useMemo } from 'react';
import { Minus, Plus, Shield, Target, Zap, ChevronRight } from 'lucide-react';
import { DAMAGE_TYPES, calculateFinalDamage } from '../utils/combat';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DamageCalculator = ({ onApplyDamage, onApplyHealing, currentHp, maxHp }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Slashing');
  const [multiplier, setMultiplier] = useState(1); // 1, 0.5, 2, 0
  const [save, setSave] = useState('none'); // 'none', 'fail', 'success'

  const finalAmount = useMemo(() => {
    const val = parseInt(amount) || 0;
    return calculateFinalDamage({ amount: val, type, multiplier, save });
  }, [amount, type, multiplier, save]);

  const projectedHp = useMemo(() => {
    return Math.max(0, currentHp - finalAmount);
  }, [currentHp, finalAmount]);

  const handleApply = (isHealing) => {
    if (isHealing) {
      onApplyHealing(parseInt(amount) || 0);
    } else {
      onApplyDamage(finalAmount, type);
    }
    setAmount('');
    setMultiplier(1);
    setSave('none');
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      {/* Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm font-bold text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
          />
          {amount && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base</span>
            </div>
          )}
        </div>

        <select 
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none focus:border-indigo-500/30 transition-all"
        >
          {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Modifier Row */}
      <div className="flex items-center gap-2">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 flex-1">
          {[
            { label: 'Norm', val: 1 },
            { label: 'Res', val: 0.5 },
            { label: 'Vuln', val: 2 },
            { label: 'Imm', val: 0 }
          ].map((m) => (
            <button
              key={m.label}
              onClick={() => setMultiplier(m.val)}
              className={cn(
                "flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                multiplier === m.val ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 flex-1">
          {[
            { label: 'No Save', val: 'none' },
            { label: 'Pass', val: 'success' }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSave(s.val)}
              className={cn(
                "flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                save === s.val ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview & Action Row */}
      <div className="flex items-center justify-between gap-4 mt-1">
        <div className="flex items-center gap-3">
          {amount && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Result</span>
              <ChevronRight className="w-3 h-3 text-indigo-500" />
              <span className="text-sm font-black text-white font-mono">{finalAmount}</span>
              <span className="text-[9px] font-bold text-slate-500 lowercase">{type.toLowerCase()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => handleApply(false)}
            disabled={!amount}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-20 disabled:hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20"
          >
            <Minus className="w-3.5 h-3.5" /> Damage
          </button>
          <button 
            onClick={() => handleApply(true)}
            disabled={!amount}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Heal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DamageCalculator;
