import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Swords, Users } from 'lucide-react';
import MapDisplay from './MapDisplay';
import NowActingPanel from './NowActingPanel';
import InitiativeLedger from './InitiativeLedger';
import BattlemasterQuickActions from './BattlemasterQuickActions';

// ── Layout constants ─────────────────────────────────────────────
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 420;
const COLLAPSED_W = 36;
const SPRING = { type: 'spring', stiffness: 320, damping: 32 };

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function computeInitialPanelWidth() {
  if (typeof window === 'undefined') return 300;
  return clamp(Math.floor(window.innerWidth * 0.22), MIN_PANEL_W, MAX_PANEL_W);
}

// ── Component ────────────────────────────────────────────────────
const BattlemasterLayout = ({ encounter, activeEntity, toggleBestiary }) => {
  const initW = computeInitialPanelWidth();

  // Separate widths so each panel resizes independently
  const [leftWidth, setLeftWidth] = useState(initW);
  const [rightWidth, setRightWidth] = useState(initW);

  // Auto-collapse on narrow viewports — only on initial mount, respects user choices after
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 700);
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth >= 900);

  // Track whether a resize drag is active (disables spring to avoid lag)
  const [isResizing, setIsResizing] = useState(false);

  // Refs for drag state — avoids triggering re-renders during mousemove
  const dragging = useRef(null); // null | 'left' | 'right'
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  // ── Global mouse handlers for resize ──────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - dragStartX.current;
      if (dragging.current === 'left') {
        setLeftWidth(clamp(dragStartW.current + delta, MIN_PANEL_W, MAX_PANEL_W));
      } else {
        setRightWidth(clamp(dragStartW.current - delta, MIN_PANEL_W, MAX_PANEL_W));
      }
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = null;
        document.body.style.cursor = '';
        setIsResizing(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = useCallback((side, e) => {
    if (side === 'left' && !leftOpen) return;
    if (side === 'right' && !rightOpen) return;
    dragging.current = side;
    dragStartX.current = e.clientX;
    dragStartW.current = side === 'left' ? leftWidth : rightWidth;
    document.body.style.cursor = 'col-resize';
    setIsResizing(true);
    e.preventDefault();
  }, [leftOpen, rightOpen, leftWidth, rightWidth]);

  const panelTransition = isResizing ? { duration: 0 } : SPRING;

  return (
    <div className="flex h-full w-full overflow-hidden select-none">

      {/* ── LEFT PANEL — Now Acting ──────────────────────────── */}
      <motion.div
        animate={{ width: leftOpen ? leftWidth : COLLAPSED_W }}
        transition={panelTransition}
        className="relative flex-shrink-0 flex flex-col h-full bg-[var(--color-obsidian-950)] border-r border-white/5 z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {leftOpen ? (
            <motion.div
              key="left-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.07 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="absolute inset-0 flex flex-col"
              style={{ width: leftWidth }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Now Acting</span>
                </div>
                <button
                  onClick={() => setLeftOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-slate-300"
                  title="Collapse Now Acting panel"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
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
                  <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
                    <Swords className="w-8 h-8 text-slate-800" />
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-relaxed">
                      No active combatant.<br />Add units and begin.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Strike strip — pinned at panel bottom */}
              <BattlemasterQuickActions
                activeEntity={activeEntity}
                applyDamage={encounter.applyDamage}
                applyHealing={encounter.applyHealing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="left-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.07 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
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

      {/* ── LEFT RESIZE HANDLE ───────────────────────────────── */}
      {leftOpen && (
        <div
          className="w-[5px] flex-shrink-0 h-full cursor-col-resize z-20 group"
          onMouseDown={(e) => startDrag('left', e)}
          title="Drag to resize"
        >
          <div className="h-full w-[1px] mx-auto bg-white/5 group-hover:bg-indigo-500/40 group-active:bg-indigo-500/60 transition-colors" />
        </div>
      )}

      {/* ── CENTER — Tactical Map ────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <MapDisplay encounter={encounter} />
      </div>

      {/* ── RIGHT RESIZE HANDLE ──────────────────────────────── */}
      {rightOpen && (
        <div
          className="w-[5px] flex-shrink-0 h-full cursor-col-resize z-20 group"
          onMouseDown={(e) => startDrag('right', e)}
          title="Drag to resize"
        >
          <div className="h-full w-[1px] mx-auto bg-white/5 group-hover:bg-indigo-500/40 group-active:bg-indigo-500/60 transition-colors" />
        </div>
      )}

      {/* ── RIGHT PANEL — Field Units (Initiative) ───────────── */}
      <motion.div
        animate={{ width: rightOpen ? rightWidth : COLLAPSED_W }}
        transition={panelTransition}
        className="relative flex-shrink-0 flex flex-col h-full bg-[var(--color-obsidian-950)] border-l border-white/5 z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {rightOpen ? (
            <motion.div
              key="right-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.07 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="absolute inset-0 flex flex-col"
              style={{ width: rightWidth }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/30 flex-shrink-0">
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-slate-300"
                  title="Collapse Field Units panel"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Field Units</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>

              <div className="flex-1 overflow-hidden min-h-0">
                <InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="right-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.07 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
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
