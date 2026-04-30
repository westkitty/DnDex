import React, { useState, useMemo } from 'react';
import { Minus, Plus, Shield, Target, Zap, ChevronRight } from 'lucide-react';
import { DAMAGE_TYPES, calculateFinalDamage } from '../utils/combat';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DamageCalculator = ({ onApplyDamage, onApplyHealing }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Slashing');
  const [multiplier, setMultiplier] = useState(1); // 1, 0.5, 2, 0
  const [save, setSave] = useState('none'); // 'none', 'fail', 'success'
  const [toGroup, setToGroup] = useState(false);

  const finalAmount = useMemo(() => {
    const val = parseInt(amount) || 0;
    return calculateFinalDamage({ amount: val, type, multiplier, save });
  }, [amount, type, multiplier, save]);

  const handleApply = (isHealing) => {
    const amt = parseInt(amount) || 0;
    if (isHealing) {
      onApplyHealing(amt, toGroup);
    } else {
      onApplyDamage(finalAmount, type, toGroup);
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
        <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/5 flex-[2]">
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
                "flex-1 py-1.5 text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all",
                multiplier === m.val ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/5 flex-1">
          {[
            { label: 'Fail', val: 'none' },
            { label: 'Pass', val: 'success' }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSave(s.val)}
              className={cn(
                "flex-1 py-1.5 text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all",
                save === s.val ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Toggle & Preview Row */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <button
          onClick={() => setToGroup(!toGroup)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest",
            toGroup ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "bg-black/20 border-white/5 text-slate-600 hover:text-slate-400"
          )}
        >
          <Zap className={cn("w-3 h-3", toGroup && "fill-current")} />
          {toGroup ? "Apply to Group" : "Target Single"}
        </button>

        <div className="flex gap-2">
          <button 
            onClick={() => handleApply(false)}
            disabled={!amount}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-20 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20"
          >
            <Minus className="w-3.5 h-3.5" /> Damage
          </button>
          <button 
            onClick={() => handleApply(true)}
            disabled={!amount}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Heal
          </button>
        </div>
      </div>

      {amount && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mt-1 py-1.5 bg-indigo-500/5 rounded-lg border border-indigo-500/10"
        >
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Final Result:</span>
          <span className="text-xs font-black text-white font-mono">{finalAmount} {type.toLowerCase()}</span>
        </motion.div>
      )}
    </div>
  );
};

export default DamageCalculator;
