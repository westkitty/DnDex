import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Pencil, Eraser, Move, Maximize, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
      color: tool === 'eraser' ? '#0a0a0a' : '#6366f1',
      size: tool === 'eraser' ? 20 : 3
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
    if (confirm("Clear all drawings?")) {
      updateMap({ drawing: [] });
    }
  };

  return (
    <div className="flex flex-col h-full bg-dragon-950 relative overflow-hidden rounded-3xl border border-white/5">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="glass p-1.5 rounded-2xl flex flex-col gap-1 border border-white/10">
          <ToolButton 
            active={tool === 'move'} 
            onClick={() => setTool('move')} 
            icon={<Move className="w-4 h-4" />} 
            label="Move Tokens"
          />
          <ToolButton 
            active={tool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            icon={<Pencil className="w-4 h-4" />} 
            label="Draw"
          />
          <ToolButton 
            active={tool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<Eraser className="w-4 h-4" />} 
            label="Eraser"
          />
          <div className="h-px bg-white/10 my-1 mx-2" />
          <ToolButton 
            onClick={clearDrawing} 
            icon={<Trash2 className="w-4 h-4" />} 
            label="Clear All"
            danger
          />
        </div>
      </div>

      {/* Map Canvas Layer */}
      <div 
        ref={containerRef}
        className="flex-1 relative cursor-crosshair overflow-auto scrollbar-none bg-dragon-900/50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas 
          ref={canvasRef}
          width={2000}
          height={2000}
          className="absolute top-0 left-0"
        />

        {/* Tokens Layer */}
        {entities.map((entity, index) => {
          const pos = map.tokens[entity.id] || { x: 100 + (index * 60), y: 100 };
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
      <div className="absolute bottom-4 right-4 glass px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-dragon-400 pointer-events-none">
        {entities.length} Tokens on Board • 1sq = 5ft
      </div>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, label, danger }) => (
  <button 
    onClick={onClick}
    title={label}
    className={cn(
      "p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center",
      active 
        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
        : danger 
          ? "text-rose-400 hover:bg-rose-500/10"
          : "text-dragon-400 hover:bg-white/5"
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
    <div 
      onMouseDown={handleMouseDown}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        width: GRID_SIZE - 4, 
        height: GRID_SIZE - 4,
        zIndex: isDragging ? 50 : 10
      }}
      className={cn(
        "absolute rounded-full border-2 flex items-center justify-center transition-shadow select-none group",
        entity.isPlayer ? "bg-indigo-600 border-indigo-400" : "bg-rose-700 border-rose-500",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging && "shadow-2xl scale-110 ring-4 ring-white/20 z-50",
        entity.hp <= 0 && "opacity-30 grayscale"
      )}
    >
      <span className="text-white font-black text-[10px] uppercase truncate px-1">
        {entity.name.substring(0, 2)}
      </span>
      
      {/* Tooltip on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {entity.name} ({entity.hp} HP)
      </div>
    </div>
  );
};

export default MapDisplay;
