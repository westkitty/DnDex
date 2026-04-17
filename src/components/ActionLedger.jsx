import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Heart, Info, Clock, Trash2, ArrowRight, 
  Flame, Snowflake, Zap, Biohazard, Droplets, Ghost, 
  Sparkle, Brain, Target, ShieldAlert, Sun, Skull, Wind,
  Shield, ZapOff, Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const getIconConfig = (log) => {
  const type = log.type;
  const subType = log.subType?.toLowerCase() || '';
  const msg = log.message.toLowerCase();

  // 1. Explicit subType matching (Priority)
  if (subType === 'heal') return { icon: <Heart className="w-4 h-4" />, color: 'text-health-base', bg: 'bg-health-base/10' };
  if (subType === 'legendary') return { icon: <Zap className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
  if (subType === 'resistance') return { icon: <Shield className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' };
  if (subType === 'concentration') return { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' };

  // Damage Types
  if (subType === 'fire') return { icon: <Flame className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' };
  if (subType === 'cold') return { icon: <Snowflake className="w-4 h-4" />, color: 'text-blue-300', bg: 'bg-blue-500/10' };
  if (subType === 'lightning') return { icon: <Zap className="w-4 h-4" />, color: 'text-yellow-300', bg: 'bg-yellow-500/10' };
  if (subType === 'thunder') return { icon: <Wind className="w-4 h-4" />, color: 'text-cyan-300', bg: 'bg-cyan-500/10' };
  if (subType === 'poison') return { icon: <Biohazard className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (subType === 'acid') return { icon: <Droplets className="w-4 h-4" />, color: 'text-lime-400', bg: 'bg-lime-500/10' };
  if (subType === 'necrotic') return { icon: <Skull className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10' };
  if (subType === 'radiant') return { icon: <Sun className="w-4 h-4" />, color: 'text-yellow-100', bg: 'bg-yellow-100/10' };
  if (subType === 'force') return { icon: <Target className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
  if (subType === 'psychic') return { icon: <Brain className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10' };

  // 2. Fallbacks based on message parsing
  if (msg.includes('group')) return { icon: <Users className="w-4 h-4" />, color: 'text-indigo-300', bg: 'bg-indigo-500/10' };
  if (type === 'heal') return { icon: <Heart className="w-4 h-4" />, color: 'text-health-base', bg: 'bg-health-base/10' };
  if (type === 'damage') return { icon: <Swords className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' };

  return { icon: <Info className="w-4 h-4" />, color: 'text-dragon-400', bg: 'bg-dragon-500/10' };
};

const ActionLedger = ({ logs = [], onClear }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to top (where newest logs are) when logs change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-2 mb-4 shrink-0">
        <span className="text-[10px] font-bold text-dragon-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Clock className="w-3 h-3" /> Action Ledger
        </span>
        {logs.length > 0 && (
          <button 
            onClick={onClear}
            className="group text-[10px] font-bold text-dragon-600 hover:text-rose-500 uppercase tracking-tighter flex items-center gap-1 transition-all duration-300"
          >
            <Trash2 className="w-3 h-3 transition-transform group-hover:scale-110" /> 
            Purge Logs
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-1 pb-4 mask-fade-edge"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {logs.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 select-none"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-dragon-900/50 flex items-center justify-center border border-dragon-800/30">
                <Info className="w-6 h-6 text-dragon-700" />
              </div>
              <p className="text-xs italic font-serif text-dragon-600">The cycle of combat begins. No entries recorded.</p>
            </motion.div>
          ) : (
            logs.map((log) => {
              const config = getIconConfig(log);
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={cn(
                    "relative group p-3 rounded-xl border border-white/5 glass transition-all duration-300",
                    "hover:border-white/10 hover:bg-white/[0.02]",
                    log.type === 'damage' ? "hover:border-rose-500/20" : 
                    log.type === 'heal' ? "hover:border-health-base/20" : ""
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "mt-0.5 p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110",
                      config.bg, config.color
                    )}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-dragon-600 uppercase tracking-tighter">{log.timestamp}</span>
                        {log.subType && (
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", config.bg, config.color)}>
                            {log.subType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dragon-200 leading-relaxed font-medium">
                        {log.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity blur-xl",
                    config.color.replace('text-', 'bg-')
                  )} />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActionLedger;

