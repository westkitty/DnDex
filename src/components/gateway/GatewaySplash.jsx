import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STATUS_LINES = [
  'Loading local encounter state…',
  'Syncing tactical workspace…',
  'Restoring map assets…',
  'Opening DnDex console…',
];

/**
 * D20 hexagonal glyph — faithfully recreated from the Vault Architect icon.svg.
 * Colors adapted to the DnDex indigo/ether palette.
 */
function GlyphSVG() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="gw-bg-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gw-center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" rx="96" fill="#05050a" />
      <rect width="512" height="512" rx="96" fill="url(#gw-bg-glow)" />

      {/* Hexagonal outline */}
      <polygon
        points="256,64 422,160 422,352 256,448 90,352 90,160"
        fill="none"
        stroke="#818cf8"
        strokeWidth="11"
        strokeLinejoin="round"
        opacity="0.92"
      />

      {/* Face dividers: each vertex to center */}
      <line x1="256" y1="64"  x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />
      <line x1="422" y1="160" x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />
      <line x1="422" y1="352" x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />
      <line x1="256" y1="448" x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />
      <line x1="90"  y1="352" x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />
      <line x1="90"  y1="160" x2="256" y2="256" stroke="#818cf8" strokeWidth="5" opacity="0.38" />

      {/* Mid equator */}
      <line x1="90" y1="256" x2="422" y2="256" stroke="#818cf8" strokeWidth="4" opacity="0.18" />

      {/* Vertex accent dots */}
      <circle cx="256" cy="64"  r="9" fill="#818cf8" opacity="0.75" />
      <circle cx="422" cy="160" r="7" fill="#818cf8" opacity="0.52" />
      <circle cx="422" cy="352" r="7" fill="#818cf8" opacity="0.52" />
      <circle cx="256" cy="448" r="9" fill="#818cf8" opacity="0.75" />
      <circle cx="90"  cy="352" r="7" fill="#818cf8" opacity="0.52" />
      <circle cx="90"  cy="160" r="7" fill="#818cf8" opacity="0.52" />

      {/* Center glow halo */}
      <circle cx="256" cy="256" r="44" fill="url(#gw-center-glow)" />
      {/* Center dot */}
      <circle cx="256" cy="256" r="20" fill="#818cf8" opacity="0.88" />
      <circle cx="256" cy="256" r="9"  fill="white"   opacity="0.92" />
    </svg>
  );
}

/**
 * Mandatory gateway splash shown every app open.
 * UI-only session state — not persisted, not written to encounter state.
 */
export default function GatewaySplash({ onComplete }) {
  const [phase, setPhase] = useState('idle');
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const enterButtonRef = useRef(null);

  const handleEnter = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('entering');
  }, [phase]);

  const handleButtonKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      handleEnter();
    }
  }, [handleEnter]);

  useEffect(() => {
    enterButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const button = enterButtonRef.current;
    if (!button) return undefined;

    const activate = (event) => {
      event.preventDefault();
      handleEnter();
    };
    const activateFromKey = (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
        activate(event);
      }
    };

    button.addEventListener('pointerdown', activate);
    button.addEventListener('mousedown', activate);
    button.addEventListener('click', activate);
    button.addEventListener('keydown', activateFromKey);

    return () => {
      button.removeEventListener('pointerdown', activate);
      button.removeEventListener('mousedown', activate);
      button.removeEventListener('click', activate);
      button.removeEventListener('keydown', activateFromKey);
    };
  }, [handleEnter]);

  // Capture-phase listener intercepts Enter/Space before AppContent's bubble-phase handlers.
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'idle') return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleEnter();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [phase, handleEnter]);

  // Staggered status lines + completion timer.
  useEffect(() => {
    if (phase !== 'entering') return;
    const timers = [];
    STATUS_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLineCount(c => c + 1), 180 + i * 310));
    });
    const finishDelay = prefersReducedMotion ? 600 : 2300;
    timers.push(setTimeout(onComplete, finishDelay));
    return () => timers.forEach(clearTimeout);
  }, [phase, onComplete, prefersReducedMotion]);

  return (
    <div
      data-testid="gateway-splash"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="DnDex gateway"
    >
      {/* Full-screen backdrop — fades out on enter */}
      <motion.div
        className="absolute inset-0 bg-[var(--color-obsidian-950)]"
        animate={{ opacity: phase === 'entering' ? 0 : 1 }}
        transition={
          phase === 'entering'
            ? { delay: prefersReducedMotion ? 0 : 0.85, duration: prefersReducedMotion ? 0.15 : 1.0, ease: [0.4, 0, 0.2, 1] }
            : { duration: 0 }
        }
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-500/5 blur-[180px]" />
      </div>

      {/* Central glass card */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 px-12 py-10 text-center"
        style={{
          background: 'rgba(2, 4, 14, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(129, 140, 248, 0.18)',
          borderRadius: '1.5rem',
          boxShadow: '0 0 60px rgba(129, 140, 248, 0.07), 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          maxWidth: '420px',
          width: '90vw',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: phase === 'entering' ? 0 : 1,
          y: 0,
        }}
        transition={{
          opacity: phase === 'entering'
            ? { duration: prefersReducedMotion ? 0.15 : 0.45 }
            : { duration: prefersReducedMotion ? 0.1 : 1.1, ease: [0.4, 0, 0.2, 1] },
          y: { duration: prefersReducedMotion ? 0.1 : 1.1, ease: [0.4, 0, 0.2, 1] },
        }}
      >
        {/* Glyph entry button */}
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
          className="relative rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050a] cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {/* Dilation wrapper — scales to ~26x on enter */}
          <motion.div
            style={{ width: 88, height: 88, filter: 'drop-shadow(0 0 12px rgba(129,140,248,0.45))' }}
            initial={{ scale: 1, opacity: 1 }}
            animate={
              phase === 'entering' && !prefersReducedMotion
                ? { scale: 26, opacity: 0 }
                : phase === 'idle' && !prefersReducedMotion
                  ? { scale: [1, 1.045, 1], opacity: [0.92, 1, 0.92] }
                  : { scale: 1, opacity: 1 }
            }
            transition={
              phase === 'entering'
                ? { duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }
                : prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 3.2, ease: 'easeInOut', repeat: Infinity }
            }
          >
            {/* Perpetual slow rotation */}
            <motion.div
              style={{ width: '100%', height: '100%' }}
              animate={prefersReducedMotion ? { rotate: 0 } : { rotate: 360 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 14, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
            >
              <GlyphSVG />
            </motion.div>
          </motion.div>
        </button>

        {/* Eyebrow */}
        <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-indigo-400/75 -mt-1">
          Encounter Command Center
        </span>

        {/* Title block */}
        <div className="-mt-1">
          <h1 className="text-4xl font-black tracking-[0.12em] text-gradient-ether italic leading-none mb-2">
            DnDex
          </h1>
          <p className="text-[11px] font-bold text-slate-500 tracking-[0.3em] uppercase">
            DM_Hub
          </p>
        </div>

        {/* Divider */}
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.55), transparent)' }}
        />

        {/* Bottom: idle affordance or status lines */}
        <div className="min-h-[5rem] flex flex-col items-center justify-center gap-1.5 w-full">
          {phase === 'idle' && (
            <motion.p
              className="text-[11px] text-slate-600 tracking-[0.16em] uppercase font-medium"
              animate={prefersReducedMotion ? { opacity: 0.75 } : { opacity: [0.4, 0.85, 0.4] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
            >
              Click glyph · Enter · Space
            </motion.p>
          )}
          {phase === 'entering' && (
            <div className="font-mono text-[11px] space-y-1.5 w-full text-left px-2">
              {STATUS_LINES.slice(0, visibleLineCount).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 text-indigo-400/80"
                >
                  <span className="text-emerald-500" style={{ fontSize: '9px' }}>▶</span>
                  {line}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
