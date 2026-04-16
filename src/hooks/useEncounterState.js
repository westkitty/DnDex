import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Necrotic', 'Radiant', 'Force', 'Psychic'];

const INITIAL_STATE = {
  round: 1,
  turnIndex: 0,
  entities: [],
  alerts: [],
  logs: [], // Chronological audit trail
  history: [], 
  historyPointer: -1,
};

export const useEncounterState = () => {
  const [state, setState] = useState(() => ({ ...INITIAL_STATE, isHydrated: false }));

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    get('dm-hub-state').then(saved => {
      if (saved) {
        setState({ ...saved, history: [saved], historyPointer: 0, isHydrated: true });
      } else {
        setState(prev => ({ ...prev, history: [INITIAL_STATE], historyPointer: 0, isHydrated: true }));
      }
    });
  }, []);

  // Persistence to IndexedDB
  useEffect(() => {
    if (!state.isHydrated) return;
    const { history: _, historyPointer: __, isHydrated: ___, ...toSave } = state;
    set('dm-hub-state', toSave);
  }, [state]);

  // Core update function with history tracking and logging
  const updateState = useCallback((updater, logMessage = null) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      const { history: _, historyPointer: __, isHydrated: ___, logs: ____, ...cleanNew } = newState;
      const { history: _h, historyPointer: _p, isHydrated: _hy, logs: _l, ...cleanPrev } = prev;
      
      if (JSON.stringify(cleanNew) === JSON.stringify(cleanPrev)) return prev;

      // Add to logs if message provided
      let newLogs = prev.logs || [];
      const messageText = logMessage ? (typeof logMessage === 'function' ? logMessage(prev, cleanNew) : logMessage) : null;
      
      if (messageText) {
        newLogs = [{ 
          id: generateId(), 
          message: messageText, 
          timestamp: new Date().toLocaleTimeString(),
          type: messageText.includes('damage') ? 'damage' : messageText.includes('heal') ? 'heal' : 'info'
        }, ...newLogs].slice(0, 100); // Keep last 100 logs
      }

      const newHistory = prev.history.slice(0, prev.historyPointer + 1);
      newHistory.push({ ...cleanNew, logs: newLogs, note: messageText });
      
      const startIdx = Math.max(0, newHistory.length - 50);
      const cappedHistory = newHistory.slice(startIdx);
      
      return {
        ...cleanNew,
        logs: newLogs,
        history: cappedHistory,
        historyPointer: cappedHistory.length - 1,
        isHydrated: true
      };
    });
  }, []);

  // --- ACTIONS ---

  const undo = useCallback(() => {
    let note = "";
    setState(prev => {
      if (prev.historyPointer > 0) {
        // The action being undone is the one that CREATED the current state we are in.
        // So we look at the current pointer's note.
        note = prev.history[prev.historyPointer]?.note || "Action";
        const nextPointer = prev.historyPointer - 1;
        return {
          ...prev.history[nextPointer],
          history: prev.history,
          historyPointer: nextPointer,
          isHydrated: true
        };
      }
      return prev;
    });
    // This is still slightly risky due to async setState, but since note is 
    // captured from 'prev' inside the closure, and we return it from the 
    // outer function... wait.
    // Actually, in standard React useState, the outer function cannot access 'prev' 
    // synchronously. I'll change the approach: we'll return the note by peeking 
    // at the state which should be stable for the current tick.
    const currentAction = state.history[state.historyPointer];
    return currentAction?.note || "Action";
  }, [state.history, state.historyPointer]);

  const redo = useCallback(() => {
    if (state.historyPointer < state.history.length - 1) {
      const redoneAction = state.history[state.historyPointer + 1];
      const note = redoneAction?.note || "Action";
      setState(prev => {
        const nextPointer = prev.historyPointer + 1;
        return {
          ...prev.history[nextPointer],
          history: prev.history,
          historyPointer: nextPointer,
          isHydrated: true
        };
      });
      return note;
    }
    return "";
  }, [state.history, state.historyPointer]);

  const importState = useCallback((imported) => {
    if (!imported.entities) return;
    updateState({
      ...imported,
      history: [imported],
      historyPointer: 0
    }, "Encounter imported from file");
  }, [updateState]);

  const addEntity = useCallback((isPlayer = false) => {
    const name = isPlayer ? 'New Hero' : 'New Creature';
    const newEntity = {
      id: generateId(),
      name,
      isPlayer,
      hp: 10,
      maxHp: 10,
      tempHp: 0,
      ac: 10,
      dc: 10,
      initiative: 10,
      conditions: [],
      effects: [],
      concentration: false,
      groupId: '',
      narrativeNotes: '',
      resistances: [],
      immunities: [],
      vulnerabilities: [],
      hidden: false,
      legendaryActions: 0,
      maxLegendaryActions: 0,
    };

    updateState(prev => ({
      ...prev,
      entities: [...prev.entities, newEntity].sort((a, b) => b.initiative - a.initiative)
    }), `Added ${name} to the initiative.`);
  }, [updateState]);

  const updateEntity = useCallback((id, updates) => {
    updateState(prev => {
      const entity = prev.entities.find(e => e.id === id);
      const note = updates.name ? `Renamed ${entity?.name} to ${updates.name}` : updates.hp !== undefined ? `Updated ${entity?.name} HP` : `Updated ${entity?.name}`;
      return {
        ...prev,
        entities: prev.entities.map(e => e.id === id ? { ...e, ...updates } : e)
      };
    }, (prev, next) => {
      const entity = prev.entities.find(e => e.id === id);
      if (updates.name) return `Renamed ${entity?.name} to ${updates.name}.`;
      return `Updated ${entity?.name}.`;
    });
  }, [updateState]);

  const removeEntity = useCallback((id) => {
    const entity = state.entities.find(e => e.id === id);
    updateState(prev => ({
      ...prev,
      entities: prev.entities.filter(e => e.id !== id)
    }), `Removed ${entity?.name || 'entity'} from combat.`);
  }, [updateState, state.entities]);

  const addAlert = useCallback((message, type = 'info') => {
    updateState(prev => ({
      ...prev,
      alerts: [{ id: generateId(), message, type }, ...prev.alerts].slice(0, 5)
    }));
  }, [updateState]);

  const clearAlert = useCallback((id) => {
    updateState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== id)
    }));
  }, [updateState]);

  const applyHealing = useCallback((id, amount, toGroup = false) => {
    updateState(prev => {
      const target = prev.entities.find(e => e.id === id);
      const targets = toGroup && target?.groupId 
        ? prev.entities.filter(e => e.groupId === target.groupId)
        : [target];

      return {
        ...prev,
        entities: prev.entities.map(e => 
          targets.some(t => t.id === e.id) ? { ...e, hp: Math.min(e.maxHp, e.hp + amount) } : e
        )
      };
    }, (prev, next) => {
      const target = prev.entities.find(e => e.id === id);
      return `${target?.name} ${toGroup ? 'Group' : ''} healed for ${amount} HP.`;
    });
  }, [updateState]);

  const applyDamage = useCallback((id, amount, type, toGroup = false) => {
    updateState(prev => {
      const target = prev.entities.find(e => e.id === id);
      const targets = toGroup && target?.groupId 
        ? prev.entities.filter(e => e.groupId === target.groupId)
        : [target];

      let newAlerts = [...prev.alerts];
      const newEntities = prev.entities.map(e => {
        if (targets.some(t => t?.id === e.id)) {
          let actualDamage = amount;
          if (e.immunities.includes(type)) actualDamage = 0;
          else if (e.vulnerabilities.includes(type)) actualDamage *= 2;
          else if (e.resistances.includes(type)) actualDamage = Math.floor(actualDamage / 2);

          let remainingDamage = actualDamage;
          let newTempHp = e.tempHp;
          if (newTempHp > 0) {
            const absorbed = Math.min(newTempHp, remainingDamage);
            newTempHp -= absorbed;
            remainingDamage -= absorbed;
          }

          const newHp = Math.max(0, e.hp - remainingDamage);

          if (actualDamage > 0 && e.concentration) {
            const dc = Math.max(10, Math.floor(actualDamage / 2));
            newAlerts.push({
              id: generateId(),
              message: `${e.name} must make a DC ${dc} Concentration save!`,
              type: 'warning'
            });
          }

          return { ...e, hp: newHp, tempHp: newTempHp };
        }
        return e;
      });

      return {
        ...prev,
        entities: newEntities,
        alerts: newAlerts.slice(0, 5)
      };
    }, (prev, next) => {
      const target = prev.entities.find(e => e.id === id);
      return `${target?.name} ${toGroup ? 'Group' : ''} took ${amount} ${type} damage.`;
    });
  }, [updateState]);

  const advanceTurn = useCallback((direction = 1) => {
    updateState(prev => {
      if (prev.entities.length === 0) return prev;

      let newIndex = prev.turnIndex + direction;
      let newRound = prev.round;

      if (newIndex >= prev.entities.length) {
        newIndex = 0;
        newRound += 1;
      } else if (newIndex < 0) {
        newIndex = prev.entities.length - 1;
        newRound = Math.max(1, newRound - 1);
      }

      const prevActive = prev.entities[prev.turnIndex];
      const nextActive = prev.entities[newIndex];
      let newAlerts = [...prev.alerts];

      const updatedEntities = prev.entities.map(e => {
        let effects = [...e.effects];
        if (e.id === prevActive?.id && direction === 1) {
          effects = effects.map(ef => ef.tickOn === 'end' ? { ...ef, duration: ef.duration - 1 } : ef);
        }
        if (e.id === nextActive?.id && direction === 1) {
          effects = effects.map(ef => ef.tickOn === 'start' ? { ...ef, duration: ef.duration - 1 } : ef);
          
          if (!e.isPlayer && e.maxLegendaryActions > 0) {
            return { ...e, effects: effects.filter(ef => ef.duration > 0), legendaryActions: e.maxLegendaryActions };
          }
        }
        return { ...e, effects: effects.filter(ef => ef.duration > 0) };
      });

      if (prevActive?.initiative >= 20 && nextActive?.initiative < 20 && direction === 1) {
        newAlerts.push({ id: generateId(), message: "Initiative Count 20: Lair Actions!", type: 'info' });
      }

      if (prevActive?.isPlayer && direction === 1) {
        const monstersWithLegendary = updatedEntities.filter(e => !e.isPlayer && e.legendaryActions > 0 && e.hp > 0);
        if (monstersWithLegendary.length > 0) {
          newAlerts.push({ id: generateId(), message: "Player Turn Ended: Monsters may have Legendary Actions.", type: 'warning' });
        }
      }

      return {
        ...prev,
        round: newRound,
        turnIndex: newIndex,
        entities: updatedEntities,
        alerts: newAlerts.slice(0, 5)
      };
    }, (prev, next) => {
      const nextActive = next.entities[next.turnIndex];
      return direction > 0 
        ? `Advanced to ${nextActive?.name}'s turn (Round ${next.round}).` 
        : `Went back to ${nextActive?.name}'s turn.`;
    });
  }, [updateState]);

  const setEntitiesOrder = useCallback((newOrder) => {
    updateState(prev => {
      const activeId = prev.entities[prev.turnIndex]?.id;
      const newTurnIndex = newOrder.findIndex(e => e.id === activeId);

      return {
        ...prev,
        entities: newOrder,
        turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex
      };
    }, "Initiative order adjusted.");
  }, [updateState]);
  return {
    state,
    addEntity,
    updateEntity,
    removeEntity,
    advanceTurn,
    applyDamage,
    applyHealing,
    addAlert,
    clearAlert,
    setEntitiesOrder,
    importState,
    undo,
    redo,
    canUndo: state.historyPointer > 0,
    canRedo: state.historyPointer < state.history.length - 1,
  };
};
