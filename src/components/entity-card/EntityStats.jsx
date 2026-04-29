import React from 'react';
import { GripVertical, Eye, EyeOff, Shield, Target, Sparkles, Brain } from 'lucide-react';
import { cn } from './entityCardUtils';

const EntityStats = ({ 
  entity, 
  isActive, 
  updateEntity, 
  dragControls,
  isBoss 
}) => {
  return (
    <>
      {/* Initiative Tab */}
      <div className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 border-r border-white/5",
        isActive ? "bg-indigo-500/10" : "bg-black/20"
      )}>
        <div 
          className="cursor-grab text-slate-600 hover:text-indigo-400 active:cursor-grabbing p-1 transition-colors"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="relative">
          <input 
            type="number"
            value={entity.initiative}
            onChange={(e) => updateEntity({ initiative: parseInt(e.target.value) || 0 })}
            className="w-10 h-10 glass-dark rounded-xl text-center font-mono font-bold text-lg text-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Main Info Body Header */}
      <div className="flex-1 flex flex-col p-4 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <input 
              value={entity.name}
              onChange={(e) => updateEntity({ name: e.target.value })}
              className={cn(
                "bg-transparent font-serif font-bold text-xl outline-none border-b border-transparent focus:border-indigo-500/30 transition-all",
                entity.isPlayer ? "text-indigo-100" : "text-rose-100"
              )}
            />
            <button 
              onClick={() => updateEntity({ hidden: !entity.hidden })}
              className={cn(
                "p-1 rounded-lg transition-colors",
                entity.hidden ? "text-amber-500 bg-amber-500/10" : "text-slate-500 hover:text-slate-200"
              )}
            >
              {entity.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 px-3 py-1.5 glass-dark rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <input 
                  type="number"
                  value={entity.ac || 10}
                  onChange={(e) => updateEntity({ ac: parseInt(e.target.value) || 0 })}
                  className="w-5 bg-transparent text-xs font-bold text-slate-200 outline-none"
                />
              </div>
              {!entity.isPlayer && (
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <input 
                    type="number"
                    value={entity.dc || 10}
                    onChange={(e) => updateEntity({ dc: parseInt(e.target.value) || 0 })}
                    className="w-5 bg-transparent text-xs font-bold text-slate-200 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EntityStats;
