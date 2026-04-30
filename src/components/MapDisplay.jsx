import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Pencil, Eraser, Move, Maximize, ZoomIn, ZoomOut, RotateCcw, Trash2, Map as MapIcon, Grid3X3, Layers, Eye, EyeOff, ImagePlus, SlidersHorizontal, X } from 'lucide-react';
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
  const { state, updateMap, updateToken, commitTerrain, placeObject, applyTemplate, clearMap, commitDrawing, clearMapDrawing, setFogCell, clearFog, setMapBackground, clearMapBackground, setBackgroundOpacity, setBackgroundVisible } = encounter;
  const { entities, map } = state;
  const [tool, setTool] = useState('move'); // 'move', 'pencil', 'eraser', 'paint', 'stamp', 'fog'
  const [activeAsset, setActiveAsset] = useState('grass_lush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [pendingTiles, setPendingTiles] = useState({});
  const [fogMode, setFogMode] = useState('hide'); // 'hide' | 'reveal'
  const [assetCache, setAssetCache] = useState({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [bgImageVersion, setBgImageVersion] = useState(0);
  const [sketchesVisible, setSketchesVisible] = useState(true);
  const [fogVisible, setFogVisible] = useState(true);
  const bgImageRef = useRef(null);

  // Load background image object when dataUrl changes
  useEffect(() => {
    const dataUrl = map?.background?.dataUrl;
    if (!dataUrl) {
      bgImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgImageVersion(prev => prev + 1);
    };
    img.src = dataUrl;
  }, [map?.background?.dataUrl]);

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
      setIsLoadingAssets(false);
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

    // Draw background image (bottom-most layer)
    const bgImage = bgImageRef.current;
    if (bgImage && map?.background?.visible !== false) {
      ctx.save();
      ctx.globalAlpha = map.background?.opacity ?? 1;
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

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

    // Draw pending tiles (buffered during active paint stroke, not yet committed)
    Object.entries(pendingTiles).forEach(([coord, assetId]) => {
      const [gx, gy] = coord.split(',').map(Number);
      const img = assetCache[assetId];
      if (img) {
        ctx.drawImage(img, gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    });

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
    if (sketchesVisible && map?.drawing) {
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

    if (sketchesVisible && currentPath && currentPath.points && currentPath.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color || '#6366f1';
      ctx.lineWidth = currentPath.size || 3;
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      currentPath.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Draw fog overlay
    if (fogVisible && map?.fog && Object.keys(map.fog).length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      Object.keys(map.fog).forEach(coord => {
        const [gx, gy] = coord.split(',').map(Number);
        ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      });
      ctx.restore();
    }
  }, [map?.drawing, map?.terrain, map?.objects, map?.config, map?.fog, map?.background, bgImageVersion, currentPath, assetCache, showGrid, pendingTiles, sketchesVisible, fogVisible]);

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
      setPendingTiles({ [`${gx},${gy}`]: activeAsset });
      return;
    }

    if (tool === 'stamp') {
      placeObject(activeAsset, pos.x / GRID_SIZE, pos.y / GRID_SIZE);
      return;
    }

    if (tool === 'fog') {
      setIsDrawing('fog');
      setFogCell(gx, gy, fogMode === 'hide');
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
      setPendingTiles(prev => ({ ...prev, [`${gx},${gy}`]: activeAsset }));
      return;
    }

    if (isDrawing === 'fog') {
      const gx = Math.floor(pos.x / GRID_SIZE);
      const gy = Math.floor(pos.y / GRID_SIZE);
      setFogCell(gx, gy, fogMode === 'hide');
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

    if (isDrawing === 'pan') {
      setIsDrawing(false);
      setCurrentPath(null);
      return;
    }

    if (isDrawing === 'paint') {
      setIsDrawing(false);
      if (Object.keys(pendingTiles).length > 0) {
        commitTerrain(pendingTiles);
      }
      setPendingTiles({});
      return;
    }

    if (isDrawing === 'fog') {
      setIsDrawing(false);
      return;
    }

    // Pencil / eraser stroke complete — commit as single history entry
    setIsDrawing(false);
    if (currentPath && currentPath.points && currentPath.points.length > 1) {
      commitDrawing(currentPath);
    }
    setCurrentPath(null);
  };

  const clearDrawing = () => {
    if (confirm("Sanitize battlefield? This will remove all tactical sketches.")) {
      clearMapDrawing();
    }
  };

  // HUD: Map Status
  const activeEntity = entities[state.turnIndex];

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian-950)] relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-inner">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoadingAssets && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-obsidian-950)]"
          >
             <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                <MapIcon className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 opacity-50" />
             </div>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Hydrating Tactical Assets</span>
             <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">Kenney Textures Engine v1.0</span>
          </motion.div>
        )}
      </AnimatePresence>
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
            active={tool === 'fog'}
            onClick={() => setTool('fog')}
            icon={<Eye className="w-5 h-5" />}
            label="Fog of War"
          />
          {tool === 'fog' && (
            <button
              onClick={() => setFogMode(prev => prev === 'hide' ? 'reveal' : 'hide')}
              title={fogMode === 'hide' ? 'Switch to Reveal' : 'Switch to Hide'}
              className="p-3 rounded-2xl transition-all duration-200 flex items-center justify-center text-slate-500 hover:bg-white/5"
            >
              {fogMode === 'hide'
                ? <EyeOff className="w-4 h-4 text-rose-400" />
                : <Eye className="w-4 h-4 text-emerald-400" />
              }
            </button>
          )}
          <ToolButton
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            icon={<Grid3X3 className={cn("w-5 h-5", showGrid ? "text-indigo-400" : "text-slate-600")} />}
            label="Toggle Tactical Grid"
          />
          <ToolButton
            active={false}
            onClick={clearDrawing}
            icon={<Layers className="w-5 h-5 text-amber-500" />}
            label="Purge Sketches"
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
          <ToolButton
            active={false}
            onClick={clearFog}
            icon={<Eye className="w-5 h-5 text-slate-500" />}
            label="Lift All Fog"
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
              {/* Battle Map Background */}
              <section>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Battle Map</h4>
                {map?.background?.dataUrl ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                      <img src={map.background.dataUrl} alt="Battle map" className="w-full h-full object-cover" />
                      <button
                        onClick={() => clearMapBackground()}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600/80 rounded-lg text-slate-300 hover:text-white transition-all"
                        title="Remove background"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={map.background.opacity ?? 1}
                        onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1"
                      />
                      <span className="text-[9px] font-bold text-slate-500 w-7 text-right">
                        {Math.round((map.background.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        onClick={() => setBackgroundVisible(!(map.background.visible ?? true))}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {map.background.visible !== false
                          ? <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                      </button>
                      <span className="text-[10px] font-bold text-slate-400">
                        {map.background.visible !== false ? 'Background visible' : 'Background hidden'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-3 cursor-pointer group p-4 rounded-xl border border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all">
                    <ImagePlus className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors block">Upload Battle Map</span>
                      <span className="text-[9px] text-slate-600 uppercase tracking-tighter font-black">PNG · WEBP · JPEG · SVG</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setMapBackground(ev.target.result);
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} />
                  </label>
                )}
              </section>

              {/* Layer Visibility */}
              <section>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Layer Visibility</h4>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'Fog of War', visible: fogVisible, toggle: () => setFogVisible(v => !v), color: 'text-slate-400' },
                    { label: 'Tactical Sketches', visible: sketchesVisible, toggle: () => setSketchesVisible(v => !v), color: 'text-indigo-300' },
                    { label: 'Tactical Grid', visible: showGrid, toggle: () => setShowGrid(v => !v), color: 'text-slate-400' },
                    { label: 'Background Image', visible: map?.background?.visible !== false, toggle: () => setBackgroundVisible(!(map?.background?.visible ?? true)), color: 'text-amber-400', disabled: !map?.background?.dataUrl },
                  ].map(({ label, visible, toggle, color, disabled }) => (
                    <button
                      key={label}
                      onClick={toggle}
                      disabled={disabled}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {visible
                        ? <Eye className={cn('w-3.5 h-3.5', color)} />
                        : <EyeOff className="w-3.5 h-3.5 text-slate-700" />}
                      <span className={cn('text-[10px] font-bold', visible ? color : 'text-slate-600')}>{label}</span>
                    </button>
                  ))}
                </div>
              </section>

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
                      const customId = `custom_${Date.now()}`;
                      ASSETS[customId] = ev.target.result;
                      
                      // Hydrate cache immediately for custom asset
                      const img = new Image();
                      img.src = ev.target.result;
                      img.onload = () => {
                        setAssetCache(prev => ({ ...prev, [customId]: img }));
                        setActiveAsset(customId);
                      };
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
                key={entity.id}
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

  const hpPct = entity.maxHp > 0 ? entity.hp / entity.maxHp : 0;
  const isBloodied = hpPct <= 0.5;
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
      
      {/* Persistent HP bar — always visible, 3px strip below token */}
      {!isDead && entity.maxHp > 0 && (
        <div className="absolute left-[8%] right-[8%] bottom-[-5px] h-[3px] bg-black/70 rounded-full overflow-hidden pointer-events-none">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              hpPct > 0.5 ? 'bg-emerald-500' : hpPct > 0.25 ? 'bg-amber-500' : 'bg-rose-500'
            )}
            style={{ width: `${Math.max(4, hpPct * 100)}%` }}
          />
        </div>
      )}

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
