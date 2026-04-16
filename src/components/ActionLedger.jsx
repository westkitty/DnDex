import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Heart, Info, Clock, Trash2, ArrowRight, 
  Flame, Snowflake, Zap, Biohazard, Droplets, Ghost, 
  Sparkle, Brain, Target, ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const getIcon = (type, message = '') => {
  const msg = message.toLowerCase();
  if (type === 'heal') return <Heart className="w-3.5 h-3.5" />;
  if (type === 'damage') {
    if (msg.includes('fire')) return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    if (msg.includes('cold')) return <Snowflake className="w-3.5 h-3.5 text-blue-300" />;
    if (msg.includes('lightning')) return <Zap className="w-3.5 h-3.5 text-yellow-300" />;
    if (msg.includes('poison') || msg.includes('acid')) return <Biohazard className="w-3.5 h-3.5 text-emerald-400" />;
    if (msg.includes('necrotic')) return <Ghost className="w-3.5 h-3.5 text-purple-400" />;
    if (msg.includes('radiant')) return <Sparkle className="w-3.5 h-3.5 text-yellow-100" />;
    if (msg.includes('psychic')) return <Brain className="w-3.5 h-3.5 text-pink-400" />;
    if (msg.includes('force')) return <Target className="w-3.5 h-3.5 text-indigo-400" />;
    return <Swords className="w-3.5 h-3.5" />;
  }
  if (msg.includes('concentration')) return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
  return <Info className="w-3.5 h-3.5" />;
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
            logs.map((log) => (
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
                    log.type === 'damage' ? "bg-rose-500/10 text-rose-400" : 
                    log.type === 'heal' ? "bg-health-base/10 text-health-base" : 
                    "bg-indigo-500/10 text-indigo-400"
                  )}>
                    {getIcon(log.type, log.message)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[13px] leading-relaxed font-medium transition-colors duration-300",
                      log.type === 'damage' ? "text-rose-100/90" : 
                      log.type === 'heal' ? "text-emerald-100/90" : 
                      "text-dragon-200"
                    )}>
                      {log.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 opacity-40 group-hover:opacity-70 transition-opacity">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity blur-xl",
                  log.type === 'damage' ? "bg-rose-500" : 
                  log.type === 'heal' ? "bg-health-base" : 
                  "bg-indigo-500"
                )} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActionLedger;

