import React, { useState, useEffect, useMemo } from 'react';
import { useEncounterState } from './hooks/useEncounterState';
import MainDisplay from './components/MainDisplay';
import TopBar from './components/TopBar';
import RulesPanel from './components/RulesPanel';
import BestiaryModal from './components/BestiaryModal';
import CommandPalette from './components/CommandPalette';
import SnapshotDrawer from './components/SnapshotDrawer';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { ToastProvider, useToast } from './components/ToastProvider';
import { RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILITIES & DESIGN TOKENS
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * ERROR BOUNDARY
 * Protects the core app from engine failures or data corruption.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-obsidian-950)] text-slate-100 p-8 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-serif font-black mb-2 uppercase tracking-tighter text-gradient-ether">Engine Failure Detected</h1>
          <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed font-medium">
            The tactical engine encountered an unrecoverable state. This is likely due to corrupted monster data or a rendering collision.
          </p>
          <div className="flex gap-4">
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
             >
               Reboot Engine
             </button>
             <button 
               onClick={() => {
                 localStorage.clear();
                 window.location.reload();
               }}
               className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/10"
             >
               Clear Local Buffer
             </button>
          </div>
          <pre className="mt-12 p-4 glass-dark rounded-xl text-[10px] text-rose-400/50 font-mono overflow-auto max-w-2xl text-left border border-rose-500/10">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * UI STATE MACHINE CONSTANTS
 */
const UI_VIEWS = {
  LIST: 'list',
  MAP: 'map'
};

const UI_MODALS = {
  NONE: 'none',
  BESTIARY: 'bestiary',
  RULES: 'rules',
  SNAPSHOTS: 'snapshots',
  COMMAND: 'command'
};

function AppContent() {
  const encounter = useEncounterState();
  const { syncStatus } = encounter;
  const { showToast } = useToast();

  // FSM-style state management
  const [activeModal, setActiveModal] = useState(UI_MODALS.NONE);
  const [view, setView] = useState(UI_VIEWS.LIST);
  const [rulesQuery, setRulesQuery] = useState('');

  // Derived state
  const { state } = encounter;
  const activeEntity = useMemo(() => state.entities?.[state.turnIndex] ?? null, [state.entities, state.turnIndex]);

  // Handle Sync Conflict
  useEffect(() => {
    if (syncStatus === 'conflict') {
      showToast("Sync Conflict: Outdated local buffer. Refresh recommended.", "warning", 10000);
    }
  }, [syncStatus, showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when focused on an input/textarea/select to avoid interfering with typing
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // CMD/CTRL + K: Command Palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setActiveModal(prev => prev === UI_MODALS.COMMAND ? UI_MODALS.NONE : UI_MODALS.COMMAND);
      }
      // ESC: Close current modal
      if (e.key === 'Escape') {
        setActiveModal(UI_MODALS.NONE);
      }
      // B01 FIX: Space → Advance Turn (matches hint badge in NowActingPanel)
      if (e.key === ' ' && !isTyping && activeModal === UI_MODALS.NONE) {
        e.preventDefault();
        encounter.advanceTurn(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [encounter, activeModal]);

  /**
   * ACTION HANDLERS (Bridging FSM and UI)
   */
  const handleOpenRules = (query = '') => {
    setRulesQuery(query);
    setActiveModal(UI_MODALS.RULES);
  };

return (
    <LayoutGroup>
      <div className="flex flex-col h-screen bg-[var(--color-obsidian-950)] text-slate-100 selection:bg-indigo-500/30 overflow-hidden font-sans antialiased">
        {/* Spatial Background Ambience */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div 
            animate={{ 
              x: view === UI_VIEWS.MAP ? -100 : 0,
              opacity: view === UI_VIEWS.MAP ? 0.3 : 1
            }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              x: view === UI_VIEWS.MAP ? 100 : 0,
              opacity: view === UI_VIEWS.MAP ? 0.3 : 1
            }}
            className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[150px]" 
          />
        </div>

        <TopBar 
          encounter={encounter} 
          toggleRules={() => setActiveModal(prev => prev === UI_MODALS.RULES ? UI_MODALS.NONE : UI_MODALS.RULES)} 
          toggleBestiary={() => setActiveModal(prev => prev === UI_MODALS.BESTIARY ? UI_MODALS.NONE : UI_MODALS.BESTIARY)}
          toggleSnapshots={() => setActiveModal(prev => prev === UI_MODALS.SNAPSHOTS ? UI_MODALS.NONE : UI_MODALS.SNAPSHOTS)}
          view={view}
          setView={setView}
        />
        
        <main className="flex flex-1 overflow-hidden relative z-10">
          <MainDisplay
            encounter={encounter}
            view={view}
            activeEntity={activeEntity}
            toggleBestiary={() => setActiveModal(UI_MODALS.BESTIARY)}
          />
          
          <AnimatePresence mode="wait">
            {activeModal === UI_MODALS.RULES && (
              <RulesPanel 
                key="modal-rules"
                encounter={encounter} 
                onClose={() => {
                  setActiveModal(UI_MODALS.NONE);
                  setRulesQuery('');
                }} 
                initialQuery={rulesQuery}
              />
            )}
            {activeModal === UI_MODALS.BESTIARY && (
              <BestiaryModal 
                key="modal-bestiary"
                onClose={() => setActiveModal(UI_MODALS.NONE)} 
                onAdd={(monster) => {
                  encounter.addEntityFromTemplate(monster);
                  setActiveModal(UI_MODALS.NONE);
                  showToast(`Deployed ${monster.name} to the field.`, 'info');
                }}
              />
            )}
            {activeModal === UI_MODALS.SNAPSHOTS && (
              <SnapshotDrawer 
                key="modal-snapshots"
                isOpen={true}
                onClose={() => setActiveModal(UI_MODALS.NONE)}
                state={state}
                saveSnapshot={encounter.saveSnapshot}
                loadSnapshot={encounter.loadSnapshot}
                deleteSnapshot={encounter.deleteSnapshot}
              />
            )}
            {activeModal === UI_MODALS.COMMAND && (
              <CommandPalette
                key="modal-command"
                isOpen={true}
                onClose={() => setActiveModal(UI_MODALS.NONE)}
                encounter={encounter}
                setView={setView}
                toggleBestiary={() => setActiveModal(UI_MODALS.BESTIARY)}
                toggleRules={handleOpenRules}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Persistence HUD - Atomic Notification */}
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
    </LayoutGroup>
  );
}

/**
 * ROOT EXPORT
 * Wraps Content with Global Providers & Boundaries.
 */
function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppErrorBoundary>
  );
}

export default App;
