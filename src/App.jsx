import React, { useState } from 'react';
import { useEncounterState } from './hooks/useEncounterState';
import MainDisplay from './components/MainDisplay';
import TopBar from './components/TopBar';
import RulesPanel from './components/RulesPanel';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/ToastProvider';

function App() {
  const encounter = useEncounterState();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-dragon-950 text-dragon-100 selection:bg-indigo-500/30">
      <TopBar encounter={encounter} toggleRules={() => setIsRulesOpen(!isRulesOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <MainDisplay encounter={encounter} />
        
        <AnimatePresence>
          {isRulesOpen && (
            <RulesPanel encounter={encounter} onClose={() => setIsRulesOpen(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Persistence / Offline Indicator */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-dragon-400">
          <div className="w-1.5 h-1.5 rounded-full bg-health-base animate-pulse" />
          Offline Ready / Auto-saving
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

export default App;
