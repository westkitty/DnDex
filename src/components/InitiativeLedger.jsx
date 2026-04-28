import React from 'react';
import { Reorder, AnimatePresence, useDragControls, motion } from 'framer-motion';
import EntityCard from './EntityCard';
import { Flag, Zap, Swords, UserPlus } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      <InitiativeItemMarker isActive={index === turnIndex} isUpcoming={index === (turnIndex + 1) % entities.length} />
      <EntityCard
        entity={entity}
        isActive={index === turnIndex}
        isUpcoming={index === (turnIndex + 1) % entities.length}
        updateEntity={updateEntity}
        removeEntity={removeEntity}
        applyDamage={applyDamage}
        applyHealing={applyHealing}
        resolveConcentration={resolveConcentration}
        spendLegendaryAction={spendLegendaryAction}
        spendLegendaryResistance={spendLegendaryResistance}
        alerts={entityAlerts}
        dragControls={dragControls}
        duplicateEntity={duplicateEntity}
      />
    </Reorder.Item>
  );
};

const InitiativeItemMarker = ({ isActive, isUpcoming }) => {
  if (!isActive && !isUpcoming) return null;
  return (
    <div className={cn(
      "absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full z-10",
      isActive ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "bg-slate-700"
    )} />
  );
};

const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
};

const InitiativeLedger = ({ encounter }) => {
  const { 
    state, setEntitiesOrder, updateEntity, removeEntity, 
    applyDamage, applyHealing, resolveConcentration,
    spendLegendaryAction, spendLegendaryResistance, duplicateEntity, addEntity
  } = encounter;
  const { entities, turnIndex, alerts } = state;

  if (entities.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 px-6 glass-dark rounded-3xl border border-dashed border-white/10"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
          <Swords className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">The Battlefield is Empty</h3>
        <p className="text-sm text-slate-500 text-center max-w-xs mb-8">Deploy your heroes and foes to begin the tactical sequence.</p>
        <div className="flex gap-3">
          <button onClick={() => addEntity(true)} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
            <UserPlus className="w-4 h-4" /> Add Hero
          </button>
          <button onClick={() => addEntity(false)} className="flex items-center gap-2 px-6 py-2.5 glass-dark hover:bg-white/5 text-slate-300 rounded-xl font-bold transition-all active:scale-95 border border-white/10">
            Add Foe
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-40 relative">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
            <Zap className="w-3 h-3 fill-current" /> Tactical Sequence
          </h3>
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
            {entities.length} Units in Deployment
          </span>
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={entities} 
        onReorder={setEntitiesOrder}
        className="space-y-4"
      >
        <AnimatePresence initial={false}>
          {entities.map((entity, index) => {
            const showLairActionMarker = index === 0 && entity.initiative < 20 || (index > 0 && entities[index-1].initiative >= 20 && entity.initiative < 20);
            
            return (
              <React.Fragment key={entity.id}>
                {showLairActionMarker && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 py-3 px-4 rounded-xl bg-rose-500/5 border border-rose-500/10"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">
                      Lair Actions Phase (Init 20)
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-rose-500/20 to-transparent" />
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
      <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity flex justify-center">
        <div className="glass px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 border-white/5 flex items-center gap-3">
          <Flag className="w-3 h-3" /> End of Deployment
        </div>
      </div>
    </div>
  );
};

export default InitiativeLedger;
