import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Info, Swords } from 'lucide-react';
import InitiativeLedger from './InitiativeLedger';
import MapDisplay from './MapDisplay';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MainDisplay = ({ encounter, view }) => {
  const { state, clearAlert } = encounter;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-dragon-950/20">
      {/* Alerts Overlay / Top Bar Alerts */}
      <AnimatePresence>
        {state.alerts.length > 0 && (
          <div className="flex flex-col gap-px border-b border-white/5 bg-dragon-950">
            {state.alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`flex items-center justify-between px-6 py-2.5 text-sm border-l-4 ${
                  alert.type === 'warning' 
                    ? 'bg-warning-dark/10 border-warning-base text-warning-light' 
                    : 'bg-indigo-950/30 border-indigo-500 text-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  <span className="font-semibold">{alert.message}</span>
                </div>
                <button onClick={() => clearAlert(alert.id)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className={cn("flex-1 overflow-y-auto scrollbar-custom p-4 md:p-8", view === 'map' && "flex flex-col")}>
        <div className={cn("mx-auto", view === 'map' ? "w-full h-full" : "max-w-5xl")}>
          {state.entities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center p-12 glass rounded-3xl border-dashed border-2 border-white/5"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Swords className="w-10 h-10 text-dragon-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-dragon-400 mb-2">The Battlefield is Empty</h2>
              <p className="text-dragon-500 max-w-xs leading-relaxed">
                Add players and monsters using the controls above to start the encounter.
              </p>
            </motion.div>
          ) : view === 'map' ? (
            <MapDisplay encounter={encounter} />
          ) : (
            <InitiativeLedger encounter={encounter} />
          )}
        </div>
      </div>
    </main>
  );
};

export default MainDisplay;
