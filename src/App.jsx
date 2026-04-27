import React, { useState, useEffect } from 'react';
import { useEncounterState } from './hooks/useEncounterState';
import MainDisplay from './components/MainDisplay';
import TopBar from './components/TopBar';
import RulesPanel from './components/RulesPanel';
import BestiaryModal from './components/BestiaryModal';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'map'

  // Handle Sync Conflict
  useEffect(() => {
    if (syncStatus === 'conflict') {
      showToast("Sync Conflict: This tab has outdated data. Please refresh to sync with other windows.", "warning", 10000);
    }
  }, [syncStatus, showToast]);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-obsidian-950)] text-slate-100 selection:bg-indigo-500/30 overflow-hidden font-sans antialiased">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <TopBar 
        encounter={encounter} 
        toggleRules={() => setIsRulesOpen(!isRulesOpen)} 
        toggleBestiary={() => setIsBestiaryOpen(!isBestiaryOpen)}
        view={view}
        setView={setView}
      />
      
      <main className="flex flex-1 overflow-hidden relative z-10">
        <MainDisplay encounter={encounter} view={view} />
        
        <AnimatePresence>
          {isRulesOpen && (
            <RulesPanel encounter={encounter} onClose={() => setIsRulesOpen(false)} />
          )}
          {isBestiaryOpen && (
            <BestiaryModal 
              onClose={() => setIsBestiaryOpen(false)} 
              onAdd={(monster) => {
                encounter.addEntityFromTemplate(monster);
                setIsBestiaryOpen(false);
                showToast(`Deployed ${monster.name} to the field.`, 'info');
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Persistence HUD */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-3 glass px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-white/5 shadow-2xl",
            syncStatus === 'saving' && "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            syncStatus === 'saved' && "text-emerald-400 bg-emerald-500/5 border-emerald-500/30",
            syncStatus === 'conflict' && "text-amber-400 bg-amber-500/10 border-amber-500/50 animate-pulse",
            syncStatus === 'error' && "text-rose-400 bg-rose-500/10 border-rose-500/50"
          )}
        >
          <div className="relative">
            {syncStatus === 'saving' ? <RefreshCw className="w-3 h-3 animate-spin" /> :
             syncStatus === 'saved' ? <CheckCircle2 className="w-3 h-3" /> :
             <AlertTriangle className="w-3 h-3" />}
             {syncStatus === 'saved' && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />}
          </div>
          
          <span className="drop-shadow-sm">
            {syncStatus === 'saving' ? 'Syncing...' : 
             syncStatus === 'conflict' ? 'Conflict' : 
             syncStatus === 'error' ? 'Sync Error' : 'System Ready'}
          </span>
        </motion.div>
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
