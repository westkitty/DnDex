import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Swords, Users } from 'lucide-react';
import MapDisplay from './MapDisplay';
import NowActingPanel from './NowActingPanel';
import InitiativeLedger from './InitiativeLedger';

const PANEL_W = 308;
const COLLAPSED_W = 36;
const SPRING = { type: 'spring', stiffness: 320, damping: 32 };

const BattlemasterLayout = ({ encounter, activeEntity, toggleBestiary }) => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── LEFT PANEL — Now Acting ───────────────────────────────── */}
      <motion.div
        animate={{ width: leftOpen ? PANEL_W : COLLAPSED_W }}
        transition={SPRING}
        className="relative flex-shrink-0 flex flex-col h-full bg-[var(--color-obsidian-950)] border-r border-white/5 z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {leftOpen ? (
            <motion.div
              key="left-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex flex-col"
              style={{ width: PANEL_W }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Now Acting</span>
                </div>
                <button
                  onClick={() => setLeftOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-slate-300"
                  title="Collapse"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <NowActingPanel
                  round={encounter.state.round}
                  activeEntity={activeEntity}
                  advanceTurn={encounter.advanceTurn}
                  applyDamage={encounter.applyDamage}
                  applyHealing={encounter.applyHealing}
                  updateEntity={encounter.updateEntity}
                  spendLegendaryAction={encounter.spendLegendaryAction}
                  spendLegendaryResistance={encounter.spendLegendaryResistance}
                />
                {!activeEntity && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
                    <Swords className="w-8 h-8 text-slate-800" />
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-relaxed">
                      No active combatant.<br />Add units and begin the encounter.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="left-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex flex-col items-center pt-3 gap-2"
            >
              <button
                onClick={() => setLeftOpen(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-indigo-400"
                title="Expand Now Acting panel"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="text-[8px] font-black text-slate-800 uppercase tracking-widest select-none"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Now Acting
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── CENTER — Tactical Map ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <MapDisplay encounter={encounter} />
      </div>

      {/* ── RIGHT PANEL — Field Units (Initiative) ───────────────── */}
      <motion.div
        animate={{ width: rightOpen ? PANEL_W : COLLAPSED_W }}
        transition={SPRING}
        className="relative flex-shrink-0 flex flex-col h-full bg-[var(--color-obsidian-950)] border-l border-white/5 z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {rightOpen ? (
            <motion.div
              key="right-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex flex-col"
              style={{ width: PANEL_W }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/30 flex-shrink-0">
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-slate-300"
                  title="Collapse"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Field Units</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="right-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex flex-col items-center pt-3 gap-2"
            >
              <button
                onClick={() => setRightOpen(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-indigo-400"
                title="Expand Field Units panel"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="text-[8px] font-black text-slate-800 uppercase tracking-widest select-none"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  Field Units
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};

export default BattlemasterLayout;
