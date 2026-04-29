import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ChevronRight } from 'lucide-react';
import { cn } from './entityCardUtils';

const EntityHP = ({
  entity,
  isBloodied,
  isDead,
  hpPercent,
  dmgInput,
  setDmgInput,
  applyDamage,
  applyHealing
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 mt-auto">
      <div className="flex-1 w-full relative">
        <div className="flex justify-between items-end mb-2 px-1">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-xl font-bold font-mono",
              isDead ? "text-slate-600" : (isBloodied ? "text-rose-400" : "text-emerald-400")
            )}>
              {entity.hp}
            </span>
            {dmgInput && !isNaN(parseInt(dmgInput)) && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold text-slate-500 flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" />
                <span className={cn(
                  "font-mono",
                  parseInt(dmgInput) > 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                  {Math.max(0, entity.hp - (parseInt(dmgInput) || 0))}
                </span>
              </motion.span>
            )}
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">/ {entity.maxHp} HP</span>
          </div>
          {entity.tempHp > 0 && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              +{entity.tempHp} TMP
            </span>
          )}
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
          {/* Preview Ghost Bar */}
          {dmgInput && !isNaN(parseInt(dmgInput)) && (
            <div 
              className="absolute inset-0 bg-white/10"
              style={{ 
                width: `${Math.min(100, Math.max(0, (entity.hp - parseInt(dmgInput)) / entity.maxHp * 100))}%`,
                transition: 'width 0.2s ease-out'
              }}
            />
          )}
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
          <button 
            onClick={() => setDmgInput(Math.floor(parseInt(dmgInput) / 2 || 0).toString())} 
            className="px-1.5 py-0.5 text-[8px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase"
          >
            1/2
          </button>
          <button 
            onClick={() => setDmgInput((parseInt(dmgInput) * 2 || 0).toString())} 
            className="px-1.5 py-0.5 text-[8px] font-black text-slate-500 hover:text-rose-400 transition-colors uppercase"
          >
            2x
          </button>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => {
              applyDamage(parseInt(dmgInput) || 0, 'Slashing');
              setDmgInput('');
            }} 
            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all active:scale-90"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              applyHealing(parseInt(dmgInput) || 0);
              setDmgInput('');
            }} 
            className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityHP;
