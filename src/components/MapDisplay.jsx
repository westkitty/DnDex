import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Pencil, Eraser, Move, Maximize, ZoomIn, ZoomOut, RotateCcw, Trash2, Map as MapIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const GRID_SIZE = 50;

const MapDisplay = ({ encounter }) => {
  const { state, updateMap, updateToken } = encounter;
  const { entities, map } = state;
  const [tool, setTool] = useState('move'); // 'move', 'pencil', 'eraser'
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Redraw canvas when drawing data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw paths
    map.drawing.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color || '#6366f1';
      ctx.lineWidth = path.size || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(path.points[0].x, path.points[0].y);
      path.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    if (currentPath && currentPath.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color || '#6366f1';
      ctx.lineWidth = currentPath.size || 3;
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      currentPath.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, [map.drawing, currentPath]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (tool === 'move') return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    setCurrentPath({
      type: 'pencil',
      points: [pos],
      color: tool === 'eraser' ? 'var(--color-obsidian-950)' : 'var(--color-ether-500)',
      size: tool === 'eraser' ? 30 : 4
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, pos]
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    updateMap({
      drawing: [...map.drawing, currentPath]
    });
    setCurrentPath(null);
  };

  const clearDrawing = () => {
    if (confirm("Sanitize battlefield? This will remove all tactical sketches.")) {
      updateMap({ drawing: [] });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian-950)] relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-inner">
      {/* HUD: Toolbar */}
      <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
        <div className="glass-dark p-2 rounded-[1.5rem] flex flex-col gap-2 border border-white/10 shadow-2xl">
          <ToolButton 
            active={tool === 'move'} 
            onClick={() => setTool('move')} 
            icon={<Move className="w-5 h-5" />} 
            label="Tactical Maneuvers"
          />
          <ToolButton 
            active={tool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            icon={<Pencil className="w-5 h-5" />} 
            label="Strategic Sketch"
          />
          <ToolButton 
            active={tool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<Eraser className="w-5 h-5" />} 
            label="Clear Obstacles"
          />
          <div className="h-px bg-white/10 my-1 mx-2" />
          <ToolButton 
            onClick={clearDrawing} 
            icon={<Trash2 className="w-5 h-5" />} 
            label="Purge Map"
            danger
          />
        </div>
      </div>

      {/* HUD: Map Status */}
      <div className="absolute top-6 right-6 z-30 flex gap-3 pointer-events-none">
        <div className="glass-dark px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
           <MapIcon className="w-4 h-4 text-slate-500" />
           <div className="flex flex-col">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Theatre</span>
             <span className="text-[10px] font-bold text-slate-300">Tactical Grid • 5ft Scale</span>
           </div>
        </div>
      </div>

      {/* Map Canvas Layer */}
      <div 
        ref={containerRef}
        className="flex-1 relative cursor-crosshair overflow-auto scrollbar-none bg-[radial-gradient(circle_at_center,var(--color-obsidian-900)_0%,var(--color-obsidian-950)_100%)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas 
          ref={canvasRef}
          width={2500}
          height={2500}
          className="absolute top-0 left-0"
        />

        {/* Tokens Layer */}
        {entities.map((entity, index) => {
          const pos = map.tokens[entity.id] || { x: 200 + (index * 60), y: 200 };
          return (
            <Token 
              key={entity.id}
              entity={entity}
              pos={pos}
              onMove={(newPos, isFinal) => updateToken(entity.id, newPos, isFinal)}
              isDraggable={tool === 'move'}
            />
          );
        })}
      </div>

      {/* Legend / Status */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-dark px-6 py-2.5 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 pointer-events-none flex items-center gap-4">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-indigo-500" />
           <span>{entities.filter(e => e.isPlayer).length} Heroes</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-rose-500" />
           <span>{entities.filter(e => !e.isPlayer).length} Foes</span>
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, label, danger }) => (
  <button 
    onClick={onClick}
    title={label}
    className={cn(
      "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
      active 
        ? "bg-indigo-600 text-white shadow-[var(--shadow-glow-ether)] scale-110" 
        : danger 
          ? "text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
          : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
    )}
  >
    {icon}
  </button>
);

const Token = ({ entity, pos, onMove, isDraggable }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    e.stopPropagation();
    setIsDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      
      // Snap to grid
      const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      
      onMove({ x: snappedX, y: snappedY }, false);
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      // Final snap and commit to history
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      onMove({ x: snappedX, y: snappedY }, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, onMove]);

  return (
    <motion.div 
      onMouseDown={handleMouseDown}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        width: GRID_SIZE - 4, 
        height: GRID_SIZE - 4,
        zIndex: isDragging ? 50 : 10
      }}
      className={cn(
        "absolute rounded-full border-2 flex items-center justify-center transition-all select-none group",
        entity.isPlayer 
          ? "bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
          : "bg-rose-700 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging && "scale-125 ring-4 ring-white/10 z-50",
        entity.hp <= 0 && "opacity-30 grayscale blur-[1px]"
      )}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      <span className="text-white font-black text-[11px] uppercase tracking-tighter truncate px-1 drop-shadow-md">
        {entity.name.substring(0, 2)}
      </span>
      
      {/* Interactive HUD on hover */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass-dark px-3 py-1.5 rounded-xl text-[9px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 scale-90 group-hover:scale-100 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center gap-0.5">
           <span className="text-slate-100 uppercase tracking-widest">{entity.name}</span>
           <span className={cn(
             "text-[8px] font-bold",
             entity.hp <= entity.maxHp / 2 ? "text-rose-400" : "text-emerald-400"
           )}>{entity.hp} / {entity.maxHp} VITALITY</span>
        </div>
      </div>

      {/* Active Turn Pulse */}
      {isDraggable && !isDragging && (
        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 animate-ping opacity-20" />
      )}
    </motion.div>
  );
};

export default MapDisplay;
