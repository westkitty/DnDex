import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Info, ChevronDown, X, Brain
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TacticalAlertStack = ({ alerts, clearAlert, resolveConcentration }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 opacity-20">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">
          Sensors Nominal
        </span>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.type === 'concentration' || a.type === 'warning');
  const hasCritical = criticalAlerts.length > 0;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 h-10 rounded-xl transition-all border",
          hasCritical 
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
        )}
      >
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          hasCritical ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        )} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
          {alerts.length} Tactical Alert{alerts.length > 1 ? 's' : ''}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click-away */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-4 w-80 glass-dark z-50 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</span>
                <span className="text-[8px] font-bold px-2 py-0.5 bg-white/5 rounded-full text-slate-400">Tactical Priority</span>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col gap-3",
                      alert.type === 'concentration' || alert.type === 'warning'
                        ? "bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5"
                        : "bg-indigo-500/5 border-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {alert.type === 'concentration' ? (
                          <Brain className="w-4 h-4 text-amber-500" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-indigo-400" />
                        )}
                        <span className="text-[11px] font-bold text-slate-200 leading-tight">
                          {alert.message}
                        </span>
                      </div>
                      <button 
                        onClick={() => clearAlert(alert.id)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>

                    {alert.type === 'concentration' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => resolveConcentration(alert.entityId, true)}
                          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase rounded-lg transition-all"
                        >
                          Pass Save
                        </button>
                        <button 
                          onClick={() => resolveConcentration(alert.entityId, false)}
                          className="flex-1 py-1.5 glass-dark hover:bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase rounded-lg border border-rose-500/30 transition-all"
                        >
                          Fail Save
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {alerts.length > 3 && (
                <div className="p-3 bg-black/20 text-center">
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                    End of Tactical Log
                  </span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TacticalAlertStack;
