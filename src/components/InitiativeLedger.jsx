import React from 'react';
import { Reorder, AnimatePresence, useDragControls, motion } from 'framer-motion';
import EntityCard from './EntityCard';
import { Flag, Zap } from 'lucide-react';

const InitiativeItem = ({ 
  entity, index, turnIndex, entities, updateEntity, removeEntity, 
  applyDamage, applyHealing, resolveConcentration, alerts,
  spendLegendaryAction, spendLegendaryResistance, duplicateEntity
}) => {
  const dragControls = useDragControls();

  const entityAlerts = alerts.filter(a => a.entityId === entity.id);

  return (
    <Reorder.Item
      value={entity}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <EntityCard
        entity={entity}
        isActive={index === turnIndex}
        isUpcoming={index === (turnIndex + 1) % entities.length}
        updateEntity={updateEntity}
        removeEntity={removeEntity}
        applyDamage={applyDamage}
        applyHealing={applyHealing}
        resolveConcentration={resolveConcentration}
        alerts={entityAlerts}
        dragControls={dragControls}
        duplicateEntity={duplicateEntity}
      />
    </Reorder.Item>
  );
};

const InitiativeLedger = ({ encounter }) => {
  const { 
    state, setEntitiesOrder, updateEntity, removeEntity, 
    applyDamage, applyHealing, resolveConcentration,
    spendLegendaryAction, spendLegendaryResistance, duplicateEntity
  } = encounter;
  const { entities, turnIndex, alerts } = state;

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-dragon-500 flex items-center gap-2">
          < Zap className="w-3 h-3 text-warning-base" />
          Combat Sequence
        </h3>
        <span className="text-[10px] font-bold text-dragon-600 uppercase">
          {entities.length} Active Participants
        </span>
      </div>

      <Reorder.Group 
        axis="y" 
        values={entities} 
        onReorder={setEntitiesOrder}
        className="space-y-3"
      >
        <AnimatePresence initial={false}>
          {entities.map((entity, index) => {
            const showLairActionMarker = index === 0 && entity.initiative < 20 || (index > 0 && entities[index-1].initiative >= 20 && entity.initiative < 20);
            
            return (
              <React.Fragment key={entity.id}>
                {showLairActionMarker && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    className="flex items-center gap-3 py-1 px-4 border-l-2 border-rose-500/50 bg-rose-500/5"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">
                      Lair Actions (Initiative 20)
                    </span>
                    <div className="flex-1 h-px bg-rose-500/20" />
                  </motion.div>
                )}
                <InitiativeItem
                  entity={entity}
                  index={index}
                  turnIndex={turnIndex}
                  entities={entities}
                  updateEntity={(updates) => updateEntity(entity.id, updates)}
                  removeEntity={() => removeEntity(entity.id)}
                  applyDamage={(amt, type, group) => applyDamage(entity.id, amt, type, group)}
                  applyHealing={(amt, group) => applyHealing(entity.id, amt, group)}
                  resolveConcentration={resolveConcentration}
                  spendLegendaryAction={spendLegendaryAction}
                  spendLegendaryResistance={spendLegendaryResistance}
                  duplicateEntity={() => duplicateEntity(entity.id)}
                  alerts={alerts}
                />
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {/* Turn Marker Anchor */}
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
