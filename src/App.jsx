import React, { useState, useEffect } from 'react';
import { useEncounterState } from './hooks/useEncounterState';
import MainDisplay from './components/MainDisplay';
import TopBar from './components/TopBar';
import RulesPanel from './components/RulesPanel';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from './components/ToastProvider';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const encounter = useEncounterState();
  const { syncStatus } = encounter;
  const { showToast } = useToast();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Handle Sync Conflict
  useEffect(() => {
    if (syncStatus === 'conflict') {
      showToast("Sync Conflict: This tab has outdated data. Please refresh to sync with other windows.", "warning", 10000);
    }
  }, [syncStatus, showToast]);

  return (
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
      <div className="fixed bottom-4 left-4 z-50 pointer-events-auto">
        <div className={cn(
          "flex items-center gap-2 glass px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-white/5",
          syncStatus === 'saving' && "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
          syncStatus === 'saved' && "text-health-base bg-health-base/5 border-health-base/30",
          syncStatus === 'conflict' && "text-warning-base bg-warning-base/10 border-warning-base/50 animate-pulse cursor-pointer",
          syncStatus === 'error' && "text-rose-400 bg-rose-500/10 border-rose-500/50 text-rose-300"
        )}>
          {syncStatus === 'saving' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {syncStatus === 'saved' && <CheckCircle2 className="w-3 h-3" />}
          {syncStatus === 'conflict' && <AlertTriangle className="w-3 h-3" />}
          
          {syncStatus === 'saving' ? 'Syncing...' : 
           syncStatus === 'conflict' ? 'Conflict Detected' : 
           syncStatus === 'error' ? 'Sync Error' : 'Encounter Synced'}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
