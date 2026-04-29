import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Pencil, Eraser, Move, Maximize, ZoomIn, ZoomOut, RotateCcw, Trash2, Map as MapIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { MAP_TEMPLATES } from '../data/MapTemplates';

const GRID_SIZE = 50;

const BASE = import.meta.env.BASE_URL || '/';

const ASSETS = {
  // Hero mappings to Kenney tiles (High quality replacements)
  grass_lush: `${BASE}assets/tiles/rpgTile018.png`,
  dirt_path: `${BASE}assets/tiles/rpgTile001.png`,
  dungeon_stone: `${BASE}assets/tiles/rpgTile163.png`,
  water_deep: `${BASE}assets/tiles/rpgTile029.png`,
  stone_wall: `${BASE}assets/tiles/rpgTile162.png`,
  wood_floor: `${BASE}assets/tiles/rpgTile039.png`,
  tree_oak: `${BASE}assets/tiles/rpgTile208.png`,
  rock_mossy: `${BASE}assets/tiles/rpgTile151.png`,
  bush_green: `${BASE}assets/tiles/rpgTile201.png`,
  stone_pillar: `${BASE}assets/tiles/rpgTile153.png`,
  ornate_rug: `${BASE}assets/tiles/rpgTile114.png`,
  wood_table: `${BASE}assets/tiles/rpgTile048.png`,
  wood_bar: `${BASE}assets/tiles/rpgTile050.png`,
  wood_chair: `${BASE}assets/tiles/rpgTile049.png`,
};

// Dynamically inject all 228 Kenney tiles into the registry
for (let i = 0; i <= 228; i++) {
  const id = `kenney_${i.toString().padStart(3, '0')}`;
  if (!ASSETS[id]) {
    ASSETS[id] = `${BASE}assets/tiles/rpgTile${i.toString().padStart(3, '0')}.png`;
  }
}

const MapDisplay = ({ encounter }) => {
  const { state, updateMap, updateToken, placeTile, placeObject, applyTemplate, clearMap } = encounter;
  const { entities, map } = state;
  const [tool, setTool] = useState('move'); // 'move', 'pencil', 'eraser', 'paint', 'stamp'
  const [activeAsset, setActiveAsset] = useState('grass_lush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [assetCache, setAssetCache] = useState({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Hydrate asset cache
  useEffect(() => {
    const loader = async () => {
      const cache = {};
      const promises = Object.entries(ASSETS).map(([id, src]) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => { cache[id] = img; resolve(); };
          img.onerror = () => resolve();
        });
      });
      await Promise.all(promises);
      setAssetCache(cache);
    };
    loader();
  }, []);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Redraw canvas when map state or current path changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base terrain (tiled background)
    const baseTileImg = assetCache[map?.config?.baseTile || 'grass_lush'];
    if (baseTileImg) {
      ctx.save();
      const pattern = ctx.createPattern(baseTileImg, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    }
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    // Draw terrain overrides
    if (map?.terrain) {
      Object.entries(map.terrain).forEach(([coord, assetId]) => {
        const [gx, gy] = coord.split(',').map(Number);
        const img = assetCache[assetId];
        if (img) {
          ctx.drawImage(img, gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
      });
    }

    // Draw objects
    if (map?.objects) {
      map.objects.forEach(obj => {
        const img = assetCache[obj.assetId];
        if (img) {
          ctx.save();
          const drawX = obj.x * GRID_SIZE;
          const drawY = obj.y * GRID_SIZE;
          const size = GRID_SIZE * (obj.scale || 1);
          ctx.translate(drawX, drawY);
          ctx.rotate((obj.rotation || 0) * Math.PI / 180);
          ctx.drawImage(img, -size/2, -size/2, size, size);
          ctx.restore();
        }
      });
    }

    // Draw tactical sketches
    if (map?.drawing) {
      map.drawing.forEach(path => {
        if (!path.points || path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color || '#6366f1';
        ctx.lineWidth = path.size || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      });
    }

    if (currentPath && currentPath.points && currentPath.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color || '#6366f1';
      ctx.lineWidth = currentPath.size || 3;
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      currentPath.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, [map?.drawing, map?.terrain, map?.objects, map?.config, currentPath, assetCache, showGrid]);

  const view = map?.view || { x: 0, y: 0, zoom: 1 };

  const getMousePos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.x) / view.zoom,
      y: (e.clientY - rect.top - view.y) / view.zoom
    };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(Math.max(view.zoom - e.deltaY * zoomSpeed, 0.2), 3);
    
    updateMap({
      view: { ...view, zoom: newZoom }
    });
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const gx = Math.floor(pos.x / GRID_SIZE);
    const gy = Math.floor(pos.y / GRID_SIZE);

    if (tool === 'paint') {
      setIsDrawing('paint');
      placeTile(gx, gy, activeAsset);
      return;
    }

    if (tool === 'stamp') {
      placeObject(activeAsset, pos.x / GRID_SIZE, pos.y / GRID_SIZE);
      return;
    }

    if (tool === 'move' && e.button === 0) {
       if (e.target.closest('.token-element')) return;
       
       setIsDrawing('pan');
       setCurrentPath({ 
         startX: e.clientX - view.x, 
         startY: e.clientY - view.y 
       });
       return;
    }
    
    if (tool === 'move') return;
    
    setIsDrawing(true);
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

    if (isDrawing === 'paint') {
      const gx = Math.floor(pos.x / GRID_SIZE);
      const gy = Math.floor(pos.y / GRID_SIZE);
      placeTile(gx, gy, activeAsset);
      return;
    }

    if (isDrawing === 'pan') {
      updateMap({
        view: { 
          ...view, 
          x: e.clientX - currentPath.startX, 
          y: e.clientY - currentPath.startY 
        }
      });
      return;
    }

    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, pos]
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    if (isDrawing === 'pan' || isDrawing === 'paint') {
      setIsDrawing(false);
      setCurrentPath(null);
      return;
    }

    setIsDrawing(false);
    updateMap({
      drawing: [...(map?.drawing || []), currentPath]
    });
    setCurrentPath(null);
  };

  const clearDrawing = () => {
    if (confirm("Sanitize battlefield? This will remove all tactical sketches.")) {
      updateMap({ drawing: [] });
    }
  };

  // HUD: Map Status
  const activeEntity = entities[state.turnIndex];

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian-950)] relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-inner">
      {/* Now Acting HUD Overlay */}
      <AnimatePresence>
        {activeEntity && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-40 flex items-center gap-4 glass-dark p-3 pr-6 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] pointer-events-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              {activeEntity.initiative}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Turn</span>
              <span className="text-sm font-bold text-slate-100">{activeEntity.name}</span>
            </div>
            <button 
              onClick={() => encounter.advanceTurn(1)}
              className="ml-4 p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all active:scale-90"
            >
              Next Turn
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD: Toolbar */}
      <div className="absolute top-6 left-6 z-[60] flex flex-col gap-3">
        <div className="glass-dark p-2 rounded-[1.5rem] flex flex-col gap-2 border border-white/10 shadow-2xl">
          <ToolButton 
            active={tool === 'move'} 
            onClick={() => setTool('move')} 
            icon={<Move className="w-5 h-5" />} 
            label="Tactical Maneuvers"
          />
          <ToolButton 
            active={tool === 'paint'} 
            onClick={() => { setTool('paint'); setPaletteOpen(true); }} 
            icon={<MapIcon className="w-5 h-5" />} 
            label="Terrain Painter"
          />
          <ToolButton 
            active={tool === 'stamp'} 
            onClick={() => { setTool('stamp'); setPaletteOpen(true); }} 
            icon={<Maximize className="w-5 h-5" />} 
            label="Object Stamp"
          />
          <ToolButton 
            active={tool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            icon={<Pencil className="w-5 h-5" />} 
            label="Tactical Sketch"
          />
          <ToolButton 
            active={!showGrid} 
            onClick={() => setShowGrid(!showGrid)} 
            icon={<Maximize className="w-5 h-5" />} 
            label="Toggle Grid"
          />
        </div>

        <div className="glass-dark p-2 rounded-[1.5rem] flex flex-col gap-2 border border-white/10 shadow-2xl">
          <ToolButton 
            active={false} 
            onClick={() => {
              if (confirm("Sanitize battlefield? This will remove all tiles and objects.")) {
                clearMap();
              }
            }} 
            icon={<Trash2 className="w-5 h-5 text-red-400" />} 
            label="Clear Battlefield"
          />
        </div>
      </div>

      {/* Palette Sidebar */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="absolute top-0 left-24 bottom-0 w-80 z-50 glass-dark border-r border-white/10 p-6 shadow-2xl flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Asset Palette</h3>
              <button 
                onClick={() => setPaletteOpen(false)} 
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {/* Templates */}
              <section>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Scene Templates</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(MAP_TEMPLATES).map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => applyTemplate(tmpl)}
                      className="group relative p-3 rounded-xl bg-white/5 hover:bg-indigo-500/20 border border-white/10 text-left transition-all overflow-hidden"
                    >
                      <div className="relative z-10">
                        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{tmpl.name}</span>
                        <p className="text-[10px] text-slate-500 group-hover:text-slate-400">{tmpl.dimensions.width}x{tmpl.dimensions.height} Grid</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/0 group-hover:to-indigo-500/5 transition-all" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Assets Grid */}
              <section>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Tactical Assets</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ASSETS).map(([id, src]) => (
                    <button
                      key={id}
                      onClick={() => setActiveAsset(id)}
                      className={cn(
                        "aspect-square rounded-xl border-2 overflow-hidden transition-all relative group",
                        activeAsset === id 
                          ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-indigo-500/20" 
                          : "border-white/5 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <img src={src} alt={id} className="w-full h-full object-cover p-1 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-white font-bold truncate block">{id.replace('_', ' ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all">
                   <Maximize className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Upload Custom Asset</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-black">PNG • WEBP • JPEG</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      // Logic to add to custom assets
                      const customId = `custom_${Date.now()}`;
                      ASSETS[customId] = ev.target.result;
                      setActiveAsset(customId);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD: Map Status (Repositioned) */}
      <div className="absolute bottom-20 right-6 z-30 flex gap-3 pointer-events-none">
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
        className="flex-1 relative cursor-crosshair overflow-hidden bg-[radial-gradient(circle_at_center,var(--color-obsidian-900)_0%,var(--color-obsidian-950)_100%)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          style={{ 
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: '0 0',
            transition: isDrawing === 'pan' ? 'none' : 'transform 0.1s ease-out'
          }}
          className="absolute inset-0"
        >
          <canvas 
            ref={canvasRef}
            width={2500}
            height={2500}
            className="absolute top-0 left-0"
          />

          {/* Tokens Layer */}
          {entities.map((entity, index) => {
            const pos = map?.tokens?.[entity.id] || { x: 200 + (index * 60), y: 200 };
            return (
              <Token 
                key={`${entity.id}-${index}`}
                entity={entity}
                pos={pos}
                onMove={(newPos, isFinal) => updateToken(entity.id, newPos, isFinal)}
                isDraggable={tool === 'move'}
                isActive={index === state.turnIndex}
                zoom={view.zoom}
                viewOffset={{ x: view.x, y: view.y }}
              />
            );
          })}
        </div>
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

const Token = ({ entity, pos, onMove, isDraggable, isActive, zoom = 1, viewOffset = { x: 0, y: 0 } }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const isBloodied = entity.hp <= entity.maxHp / 2;
  const isDead = entity.hp <= 0;

  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    e.stopPropagation();
    setIsDragging(true);
    setOffset({
      x: e.clientX - (pos.x * zoom + viewOffset.x),
      y: e.clientY - (pos.y * zoom + viewOffset.y)
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = (e.clientX - offset.x - viewOffset.x) / zoom;
      const newY = (e.clientY - offset.y - viewOffset.y) / zoom;
      
      // Snap to grid
      const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      
      onMove({ x: snappedX, y: snappedY }, false);
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      const newX = (e.clientX - offset.x - viewOffset.x) / zoom;
      const newY = (e.clientY - offset.y - viewOffset.y) / zoom;
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
        "absolute rounded-full border-2 flex items-center justify-center transition-all select-none group token-element",
        entity.isPlayer 
          ? "bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
          : "bg-rose-700 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging && "scale-125 ring-4 ring-white/10 z-50",
        isDead && "opacity-30 grayscale blur-[1px]",
        isActive && "ring-4 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]"
      )}
    >
      {/* State Rings */}
      {isActive && (
        <div className="absolute -inset-2 rounded-full border-2 border-indigo-500/50 animate-[ping_2s_infinite]" />
      )}
      {isBloodied && !isDead && (
        <div className="absolute -inset-1 rounded-full border-2 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
      )}
      {entity.concentration && (
        <div className="absolute -inset-1.5 rounded-full border-2 border-amber-500/40 border-dashed animate-[spin_10s_linear_infinite]" />
      )}

      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      <span className="text-white font-black text-[11px] uppercase tracking-tighter truncate px-1 drop-shadow-md">
        {entity.name.substring(0, 2)}
      </span>
      
      {/* Interactive HUD on hover */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass-dark px-3 py-1.5 rounded-xl text-[9px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 scale-90 group-hover:scale-100 border border-white/10 shadow-2xl z-[60]">
        <div className="flex flex-col items-center gap-0.5">
           <span className="text-slate-100 uppercase tracking-widest">{entity.name}</span>
           <span className={cn(
             "text-[8px] font-bold",
             isBloodied ? "text-rose-400" : "text-emerald-400"
           )}>{entity.hp} / {entity.maxHp} VITALITY</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapDisplay;
