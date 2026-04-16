import React from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import EntityCard from './EntityCard';
import { Flag, Zap } from 'lucide-react';

const InitiativeLedger = ({ encounter }) => {
  const { state, reorderEntities, updateEntity, removeEntity, applyDamage, applyHealing } = encounter;
  const { entities, turnIndex } = state;

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-dragon-500 flex items-center gap-2">
          <Zap className="w-3 h-3 text-warning-base" />
          Combat Sequence
        </h3>
        <span className="text-[10px] font-bold text-dragon-600 uppercase">
          {entities.length} Active Participants
        </span>
      </div>

      <Reorder.Group 
        axis="y" 
        values={entities} 
        onReorder={() => {
          // Future: Implement smooth reorder logic
        }}
        className="space-y-3"
      >
        {entities.map((entity, index) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            index={index}
            isActive={index === turnIndex}
            isUpcoming={index === (turnIndex + 1) % entities.length}
            updateEntity={(updates) => updateEntity(entity.id, updates)}
            removeEntity={() => removeEntity(entity.id)}
            applyDamage={(amt, type, group) => applyDamage(entity.id, amt, type, group)}
            applyHealing={(amt, group) => applyHealing(entity.id, amt, group)}
          />
        ))}
      </Reorder.Group>

      {/* Turn Marker Anchor (Lair Action Reminder visual if applicable) */}
      <div className="mt-8 opacity-20 hover:opacity-100 transition-opacity">
        <div className="h-px bg-dragon-800 flex items-center justify-center">
           <div className="glass px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-dragon-500 border-white/5 flex items-center gap-2">
             <Flag className="w-3 h-3" /> End of Sequence
           </div>
        </div>
      </div>
    </div>
  );
};

export default InitiativeLedger;
