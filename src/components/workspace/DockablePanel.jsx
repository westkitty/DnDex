import React, { useEffect, useRef } from 'react';
import { Minimize2, Maximize2, ArrowDownToLine, RotateCcw, X, Move, ExternalLink } from 'lucide-react';
import { cn } from '../entity-card/entityCardUtils';

const MIN_W = 220;
const MIN_H = 160;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const DockablePanel = ({
  id,
  title,
  state,
  onChange,
  onFocus,
  onMinimize,
  onRestore,
  onRedock,
  onReset,
  onUndock,
  layoutLocked,
  children,
  className
}) => {
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (!state || state.docked || state.minimized || state.collapsed || layoutLocked) return;

    const onMove = (event) => {
      if (dragRef.current) {
        const { startX, startY, startLeft, startTop } = dragRef.current;
        const nextLeft = startLeft + (event.clientX - startX);
        const nextTop = startTop + (event.clientY - startY);
        onChange(id, { left: nextLeft, top: nextTop });
      }

      if (resizeRef.current) {
        const { startX, startY, startW, startH } = resizeRef.current;
        const nextW = Math.max(MIN_W, startW + (event.clientX - startX));
        const nextH = Math.max(MIN_H, startH + (event.clientY - startY));
        onChange(id, { width: nextW, height: nextH });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [id, layoutLocked, onChange, state]);

  if (!state || state.minimized) return null;

  const floatingStyle = !state.docked
    ? {
        left: state.left,
        top: state.top,
        width: clamp(state.width, MIN_W, window.innerWidth - 48),
        height: clamp(state.height, MIN_H, window.innerHeight - 120),
        zIndex: state.z
      }
    : {};

  return (
    <section
      tabIndex={0}
      onFocus={() => onFocus(id)}
      onMouseDown={() => onFocus(id)}
      className={cn(
        'glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl',
        !state.docked && 'absolute',
        className
      )}
      style={floatingStyle}
      aria-label={title}
    >
      <header
        className={cn(
          'flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30',
          !layoutLocked && !state.docked && 'cursor-move'
        )}
        onMouseDown={(event) => {
          if (layoutLocked || state.docked) return;
          dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startLeft: state.left,
            startTop: state.top
          };
          document.body.style.cursor = 'move';
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Move className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label={state.collapsed ? 'Expand Panel' : 'Collapse Panel'}
            title={state.collapsed ? 'Expand Panel' : 'Collapse Panel'}
            onClick={() => onChange(id, { collapsed: !state.collapsed })}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
          >
            {state.collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          {state.docked ? (
            <button
              aria-label="Undock Panel"
              title="Undock Panel"
              onClick={() => onUndock(id)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              aria-label="Redock Panel"
              title="Redock Panel"
              onClick={() => onRedock(id)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            aria-label="Reset Position"
            title="Reset Position"
            onClick={() => onReset(id)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            aria-label={state.minimized ? 'Restore Panel' : 'Minimize Panel'}
            title={state.minimized ? 'Restore Panel' : 'Minimize Panel'}
            onClick={() => (state.minimized ? onRestore(id) : onMinimize(id))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {!state.collapsed && <div className="h-full overflow-hidden">{children}</div>}

      {!state.docked && !state.collapsed && !layoutLocked && (
        <button
          aria-label="Resize Panel"
          title="Resize Panel"
          className="absolute bottom-1 right-1 w-4 h-4 rounded bg-white/10 hover:bg-white/20"
          onMouseDown={(event) => {
            event.stopPropagation();
            resizeRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              startW: state.width,
              startH: state.height
            };
            document.body.style.cursor = 'nwse-resize';
          }}
        />
      )}
    </section>
  );
};

export default DockablePanel;
