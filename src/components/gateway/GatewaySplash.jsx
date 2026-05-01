import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import gatewayVideo from '../../../assets/d20starsilk.mp4';

const STATUS_LINES = [
  'Loading local encounter state…',
  'Syncing tactical workspace…',
  'Restoring map assets…',
  'Opening DnDex console…',
];

export default function GatewaySplash({ onComplete }) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState('idle');
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);

  const enterButtonRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const enteredRef = useRef(false);
  const timeoutRefs = useRef([]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimers = useCallback(() => {
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleEnter = useCallback((event) => {
    event?.preventDefault?.();
    if (enteredRef.current || phase !== 'idle') return;

    enteredRef.current = true;
    setPhase('entering');

    STATUS_LINES.forEach((_, idx) => {
      const id = setTimeout(() => {
        setVisibleLineCount((count) => Math.max(count, idx + 1));
      }, 140 + idx * 230);
      timeoutRefs.current.push(id);
    });

    const finishDelay = prefersReducedMotion ? 260 : 900;
    const doneId = setTimeout(() => {
      onCompleteRef.current?.();
    }, finishDelay);
    timeoutRefs.current.push(doneId);
  }, [phase, prefersReducedMotion]);

  const handleButtonKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
      handleEnter(event);
    }
  }, [handleEnter]);

  useEffect(() => {
    enterButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      data-testid="gateway-splash"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="DnDex gateway"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.18),transparent_40%),radial-gradient(circle_at_75%_80%,rgba(56,189,248,0.12),transparent_42%),linear-gradient(180deg,#02030a_0%,#040712_100%)]" />

      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: phase === 'idle' ? 1 : 0, scale: phase === 'idle' ? 1 : 1.02 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.45 }}
        className="relative w-[min(92vw,940px)] rounded-[2rem] border border-indigo-300/25 bg-black/35 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop-blur-xl"
      >
        <div className="grid gap-5 md:grid-cols-[1.35fr_1fr] items-center">
          <button
            ref={enterButtonRef}
            type="button"
            aria-label="Enter DnDex workspace"
            data-testid="gateway-enter"
            onClick={handleEnter}
            onPointerDown={handleEnter}
            onMouseDown={handleEnter}
            onKeyDown={handleButtonKeyDown}
            disabled={phase !== 'idle'}
            className="group relative overflow-hidden rounded-[1.4rem] border border-indigo-300/35 bg-black/60 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(129,140,248,0.30),transparent_62%)]" />
            {!videoFailed ? (
              <video
                src={gatewayVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setVideoFailed(true)}
                className="relative z-10 h-[440px] w-full object-contain"
              />
            ) : (
              <div className="relative z-10 flex h-[440px] w-full items-center justify-center bg-gradient-to-b from-indigo-950/70 to-slate-950/90">
                <span className="text-sm font-bold uppercase tracking-[0.26em] text-indigo-200/90">Portal feed unavailable</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-indigo-300/30 bg-black/65 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">Activate gateway threshold</p>
            </div>
          </button>

          <div className="rounded-[1.3rem] border border-white/15 bg-black/45 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300/80">Encounter Command Center</p>
            <h1 className="mt-2 text-5xl font-black italic tracking-[0.1em] text-gradient-ether">DnDex</h1>
            <p className="mt-2 text-[12px] font-black uppercase tracking-[0.28em] text-slate-200">DM_Hub</p>

            <div className="mt-5 min-h-[90px] space-y-2.5 font-mono text-[11px]">
              {phase === 'idle' ? (
                <p className="text-indigo-100/90">Click threshold · Enter · Space</p>
              ) : (
                STATUS_LINES.slice(0, visibleLineCount).map((line, idx) => (
                  <div key={line} className="flex items-center gap-2 text-indigo-100/85">
                    <span className="text-emerald-400">▶</span>
                    <span>{line}</span>
                    <span className="ml-auto text-indigo-300/75">0{idx + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
