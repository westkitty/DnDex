import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { CONDITIONS, CONDITION_METADATA } from '../utils/combat';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ConditionPalette = ({ activeConditions, onToggleCondition, onClose }) => {
  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
      {CONDITIONS.map(condition => {
        const meta = CONDITION_METADATA[condition];
        const Icon = LucideIcons[meta?.icon] || LucideIcons.Info;
        const isActive = activeConditions.includes(condition);

        return (
          <button
            key={condition}
            onClick={() => onToggleCondition(condition)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
              isActive 
                ? `${meta?.bg} border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10` 
                : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isActive ? "bg-white/10" : "bg-black/40 group-hover:bg-black/60"
            )}>
              <Icon className={cn("w-4 h-4", isActive ? meta?.color : "text-slate-500")} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest">{condition}</span>
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[8px] font-bold text-indigo-400 uppercase mt-0.5"
                >
                  Active
                </motion.span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConditionPalette;
