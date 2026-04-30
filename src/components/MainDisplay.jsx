import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Info, Swords } from 'lucide-react';
import InitiativeLedger from './InitiativeLedger';
import MapDisplay from './MapDisplay';
import NowActingPanel from './NowActingPanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MainDisplay = ({ encounter, view, activeEntity, toggleBestiary }) => {
  const { state, clearAlert } = encounter;

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* System Notifications (Sticky at top of content) */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <AnimatePresence>
          {state.alerts.length > 0 && (
            <div className="flex flex-col gap-2 p-4 pointer-events-auto max-w-2xl mx-auto">
              {state.alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl border shadow-2xl backdrop-blur-xl",
                    alert.type === 'warning' 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10' 
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-indigo-500/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {alert.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    <span className="uppercase tracking-widest">{alert.message}</span>
                  </div>
                  <button onClick={() => clearAlert(alert.id)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-none transition-all duration-500",
        view === 'map' ? "p-0" : "p-6 md:p-12"
      )}>
        <div className={cn("mx-auto h-full", view === 'map' ? "w-full" : "max-w-4xl")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {view === 'map' ? (
                <MapDisplay encounter={encounter} />
              ) : (
                <div className="flex flex-col gap-8">
                  <NowActingPanel 
                    round={state.round}
                    activeEntity={activeEntity}
                    advanceTurn={encounter.advanceTurn}
                    applyDamage={encounter.applyDamage}
                    applyHealing={encounter.applyHealing}
                    updateEntity={encounter.updateEntity}
                    spendLegendaryAction={encounter.spendLegendaryAction}
                    spendLegendaryResistance={encounter.spendLegendaryResistance}
                  />
                  <InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default MainDisplay;
