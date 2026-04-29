import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Heart, Info, Clock, Trash2, ArrowRight, 
  Flame, Snowflake, Zap, Biohazard, Droplets, Ghost, 
  Sparkle, Brain, Target, ShieldAlert, Sun, Skull, CloudLightning,
  Shield, ZapOff, Users, ChevronDown, ListFilter
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
  if (subType === 'heal') return { icon: <Heart className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (subType === 'legendary') return { icon: <Zap className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
  if (subType === 'resistance') return { icon: <Shield className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' };
  if (subType === 'concentration') return { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' };

  // Damage Types
  if (subType === 'fire') return { icon: <Flame className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' };
  if (subType === 'cold') return { icon: <Snowflake className="w-4 h-4" />, color: 'text-blue-300', bg: 'bg-blue-500/10' };
  if (subType === 'lightning') return { icon: <Zap className="w-4 h-4" />, color: 'text-yellow-300', bg: 'bg-yellow-500/10' };
  if (subType === 'thunder') return { icon: <CloudLightning className="w-4 h-4" />, color: 'text-cyan-300', bg: 'bg-cyan-500/10' };
  if (subType === 'poison') return { icon: <Biohazard className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (subType === 'acid') return { icon: <Droplets className="w-4 h-4" />, color: 'text-lime-400', bg: 'bg-lime-500/10' };
  if (subType === 'necrotic') return { icon: <Skull className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10' };
  if (subType === 'radiant') return { icon: <Sun className="w-4 h-4" />, color: 'text-yellow-100', bg: 'bg-yellow-100/10' };
  if (subType === 'force') return { icon: <Target className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
  if (subType === 'psychic') return { icon: <Brain className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10' };

  // 2. Fallbacks based on message parsing
  if (msg.includes('group')) return { icon: <Users className="w-4 h-4" />, color: 'text-indigo-300', bg: 'bg-indigo-500/10' };
  if (type === 'heal') return { icon: <Heart className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (type === 'damage') return { icon: <Swords className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' };

  return { icon: <Info className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-white/5' };
};

const ActionLedger = ({ logs = [], onClear }) => {
  const [filter, setFilter] = useState('all');
  const scrollRef = useRef(null);

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.type === filter || log.subType === filter);
  }, [logs, filter]);

  const groupedLogs = useMemo(() => {
    const groups = [];
    filteredLogs.forEach(log => {
      const round = log.round || 1;
      let group = groups.find(g => g.round === round);
      if (!group) {
        group = { round, logs: [] };
        groups.push(group);
      }
      group.logs.push(log);
    });
    return groups.sort((a, b) => b.round - a.round);
  }, [filteredLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--color-obsidian-900)]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-black/20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Mission Log
          </span>
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">Chronicle of Fate</span>
        </div>
        <div className="flex items-center gap-3">
          {logs.length > 0 && (
            <button 
              onClick={onClear}
              className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
              title="Purge Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-4 border-b border-white/5 bg-black/10 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Actions', icon: <ListFilter className="w-3 h-3" /> },
          { id: 'damage', label: 'Damage', icon: <Swords className="w-3 h-3" /> },
          { id: 'heal', label: 'Healing', icon: <Heart className="w-3 h-3" /> },
          { id: 'concentration', label: 'Status', icon: <Brain className="w-3 h-3" /> }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
              filter === btn.id 
                ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                : "glass-dark text-slate-500 border-white/5 hover:border-white/10"
            )}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none p-6 space-y-8 mask-fade-edge"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {groupedLogs.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20"
            >
               <div className="w-16 h-16 mb-6 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                <Info className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Silence on the Field</p>
            </motion.div>
          ) : (
            groupedLogs.map((group) => (
              <div key={group.round} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                  <span className="text-[10px] font-black text-indigo-400/50 uppercase tracking-[0.4em]">Round {group.round}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
                </div>
                
                <div className="space-y-3">
                  {group.logs.map(log => {
                    const config = getIconConfig(log);
                    return (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-black/40 transition-all duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "mt-0.5 p-2 rounded-xl shrink-0 shadow-lg",
                            config.bg, config.color
                          )}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{log.timestamp}</span>
                              {log.subType && (
                                <span className={cn(
                                  "text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-white/5",
                                  config.bg, config.color
                                )}>
                                  {log.subType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActionLedger;
