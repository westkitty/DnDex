import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);


const INITIAL_STATE = {
  round: 1,
  turnIndex: 0,
  entities: [],
  alerts: [],
  logs: [], // Chronological audit trail
  history: [], 
  historyPointer: -1,
  lastUpdated: Date.now(),
  map: {
    drawing: [], // Array of { type, points, color, size }
    tokens: {},   // Map of entityId -> { x, y }
    view: { x: 0, y: 0, zoom: 1 }
  },
  snapshots: [] // Array of { id, name, timestamp, state }
};

const SYNC_CHANNEL = "dm-hub-sync";

export const useEncounterState = () => {
  const [state, setState] = useState(() => ({ ...INITIAL_STATE, isHydrated: false }));
  const [syncStatus, setSyncStatus] = useState('saved'); // 'saved', 'saving', 'conflict'

  // Broadcast Channel for multi-tab sync
  useEffect(() => {
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channel.onmessage = (event) => {
      const remoteState = event.data;
      setState(prev => {
        if (remoteState.lastUpdated > prev.lastUpdated) {
          // Sync history and logs as well
          return { ...remoteState, isHydrated: true };
        }
        return prev;
      });
    };
    return () => channel.close();
  }, []);

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

  // Persistence to IndexedDB with collision detection
  useEffect(() => {
    if (!state.isHydrated) return;
    
    const saveState = async () => {
      setSyncStatus('saving');
      try {
        const diskState = await get('dm-hub-state');
        if (diskState && diskState.lastUpdated > state.lastUpdated) {
          setSyncStatus('conflict');
          return;
        }

        const { history: _, historyPointer: __, isHydrated: ___, ...toSave } = state;
        await set('dm-hub-state', toSave);
        
        // Broadcast to other tabs
        const channel = new BroadcastChannel(SYNC_CHANNEL);
        channel.postMessage({ ...toSave, isHydrated: true });
        channel.close();
        
        setSyncStatus('saved');
      } catch (err) {
        console.error("Save failed:", err);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(saveState, 500); // Debounce saves
    return () => clearTimeout(timer);
  }, [state]);

  // Core update function with history tracking and logging
  const updateState = useCallback((updater, logMessage = null, subType = null, skipHistory = false) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      const now = Date.now();
      
      const { history: _, historyPointer: __, isHydrated: ___, logs: ____, lastUpdated: _____, ...cleanNew } = newState;
      const { history: _h, historyPointer: _p, isHydrated: _hy, logs: _l, lastUpdated: _lu, ...cleanPrev } = prev;
      
      if (JSON.stringify(cleanNew) === JSON.stringify(cleanPrev)) return prev;

      // Add to logs if message provided
      let newLogs = prev.logs || [];
      const messageText = logMessage ? (typeof logMessage === 'function' ? logMessage(prev, cleanNew) : logMessage) : null;
      
      if (messageText) {
        newLogs = [{ 
          id: generateId(), 
          message: messageText, 
          timestamp: new Date().toLocaleTimeString(),
          round: prev.round,
          type: messageText.includes('damage') ? 'damage' : messageText.includes('heal') ? 'heal' : 'info',
          subType: subType // For rich iconography
        }, ...newLogs].slice(0, 100); // Keep last 100 logs
      }

      const stateWithMeta = { ...cleanNew, logs: newLogs, lastUpdated: now };
      
      if (skipHistory) {
        return {
          ...stateWithMeta,
          history: prev.history,
          historyPointer: prev.historyPointer,
          isHydrated: true
        };
      }

      const newHistory = prev.history.slice(0, prev.historyPointer + 1);
      newHistory.push({ ...stateWithMeta, note: messageText });
      
      const startIdx = Math.max(0, newHistory.length - 50);
      const cappedHistory = newHistory.slice(startIdx);
      
      return {
        ...stateWithMeta,
        history: cappedHistory,
        historyPointer: cappedHistory.length - 1,
        isHydrated: true
      };
    });
  }, []);

  // --- ACTIONS ---

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyPointer > 0) {
        // The action being undone is the one that CREATED the current state we are in.
        // So we look at the current pointer's note.
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
    const merged = {
      ...INITIAL_STATE,
      ...imported,
      map: { ...INITIAL_STATE.map, ...(imported.map || {}) },
      snapshots: prev.snapshots // Preserve existing snapshots on import
    };
    updateState(merged, "Encounter imported from file");
  }, [updateState]);

  const exportState = useCallback(() => {
    const { history: _, historyPointer: __, isHydrated: ___, ...toExport } = state;
    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `encounter-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

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
      legendaryActionsMax: 0,
      legendaryResistances: 0,
      legendaryResistancesMax: 0,
    };

    updateState(prev => {
      const activeId = prev.entities[prev.turnIndex]?.id;
      const newEntities = [...prev.entities, newEntity].sort((a, b) => b.initiative - a.initiative);
      const newTurnIndex = newEntities.findIndex(e => e.id === activeId);
      return {
        ...prev,
        entities: newEntities,
        turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex
      };
    }, `Added ${name} to the initiative.`);
  }, [updateState]);

  const addEntityFromTemplate = useCallback((template) => {
    const newEntity = {
      id: generateId(),
      name: template.name,
      isPlayer: false,
      hp: template.hp,
      maxHp: template.maxHp,
      tempHp: 0,
      ac: template.ac,
      dc: template.dc || 10,
      initiative: 10,
      conditions: [],
      effects: [],
      concentration: false,
      groupId: '',
      narrativeNotes: '',
      resistances: template.resistances || [],
      immunities: template.immunities || [],
      vulnerabilities: template.vulnerabilities || [],
      hidden: false,
      legendaryActions: template.legendaryActionsMax || 0,
      legendaryActionsMax: template.legendaryActionsMax || 0,
      legendaryResistances: template.legendaryResistancesMax || 0,
      legendaryResistancesMax: template.legendaryResistancesMax || 0,
      // Metadata for rich display
      size: template.size,
      type: template.type,
      alignment: template.alignment,
      stats: template.stats,
      saves: template.saves,
      skills: template.skills,
      senses: template.senses,
      languages: template.languages,
      cr: template.cr,
      traits: template.traits,
      actions: template.actions,
      legendaryActionsList: template.legendaryActions
    };

    updateState(prev => {
      const activeId = prev.entities[prev.turnIndex]?.id;
      const newEntities = [...prev.entities, newEntity].sort((a, b) => b.initiative - a.initiative);
      const newTurnIndex = newEntities.findIndex(e => e.id === activeId);
      return {
        ...prev,
        entities: newEntities,
        turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex
      };
    }, `Added ${template.name} from bestiary.`);
  }, [updateState]);

  const duplicateEntity = useCallback((id) => {
    updateState(prev => {
      const entity = prev.entities.find(e => e.id === id);
      if (!entity) return prev;
      
      // Handle name numbering robustly
      const baseName = entity.name.replace(/\s\d+$/, '').trim();
      const sameBase = prev.entities.filter(e => e.name.startsWith(baseName));
      
      let maxNum = 0;
      sameBase.forEach(e => {
        const match = e.name.match(/\s(\d+)$/);
        if (match) {
          const n = parseInt(match[1]);
          if (n > maxNum) maxNum = n;
        }
      });
      
      const newName = `${baseName} ${maxNum + 1}`;

      const cloned = {
        ...entity,
        id: generateId(),
        name: newName,
        hp: entity.maxHp,
        tempHp: 0,
        conditions: [],
        effects: [],
        concentration: false
      };

      const activeId = prev.entities[prev.turnIndex]?.id;
      const newEntities = [...prev.entities, cloned].sort((a, b) => b.initiative - a.initiative);
      const newTurnIndex = newEntities.findIndex(e => e.id === activeId);

      return {
        ...prev,
        entities: newEntities,
        turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex
      };
    }, (prev) => {
      const entity = prev.entities.find(e => e.id === id);
      return `Duplicated ${entity?.name}.`;
    });
  }, [updateState]);

  const updateEntity = useCallback((id, updates) => {
    updateState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === id ? { ...e, ...updates } : e)
    }), (prev) => {
      const entity = prev.entities.find(e => e.id === id);
      if (updates.name) return `Renamed ${entity?.name} to ${updates.name}.`;
      return `Updated ${entity?.name}.`;
    });
  }, [updateState]);

  const spendLegendaryAction = useCallback((id) => {
    updateState(prev => {
      const entity = prev.entities.find(e => e.id === id);
      if (!entity || entity.legendaryActions <= 0) return prev;
      return {
        ...prev,
        entities: prev.entities.map(e => e.id === id ? { ...e, legendaryActions: e.legendaryActions - 1 } : e)
      };
    }, (prev) => {
      const entity = prev.entities.find(e => e.id === id);
      return `${entity?.name} spent a Legendary Action.`;
    }, 'legendary');
  }, [updateState]);

  const spendLegendaryResistance = useCallback((id) => {
    updateState(prev => {
      const entity = prev.entities.find(e => e.id === id);
      if (!entity || entity.legendaryResistances <= 0) return prev;
      return {
        ...prev,
        entities: prev.entities.map(e => e.id === id ? { ...e, legendaryResistances: e.legendaryResistances - 1 } : e)
      };
    }, (prev) => {
      const entity = prev.entities.find(e => e.id === id);
      return `${entity?.name} spent a Legendary Resistance!`;
    }, 'resistance');
  }, [updateState]);

  const removeEntity = useCallback((id) => {
    updateState(prev => {
      const activeId = prev.entities[prev.turnIndex]?.id;
      const newEntities = prev.entities.filter(e => e.id !== id);
      const newTurnIndex = newEntities.findIndex(e => e.id === activeId);
      const newTokens = { ...prev.map.tokens };
      delete newTokens[id];
      return {
        ...prev,
        entities: newEntities,
        turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex,
        map: { ...prev.map, tokens: newTokens }
      };
    }, `Removed from combat.`);
  }, [updateState]);

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
    }, (prev) => {
      const target = prev.entities.find(e => e.id === id);
      return `${target?.name} ${toGroup ? 'Group' : ''} healed for ${amount} HP.`;
    }, 'heal');
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
              entityId: e.id,
              dc: dc,
              message: `${e.name} must make a DC ${dc} Concentration save!`,
              type: 'concentration'
            });
          }

          return { ...e, hp: newHp, tempHp: newTempHp };
        }
        return e;
      });

      return {
        ...prev,
        entities: newEntities,
        alerts: newAlerts.slice(0, 10) // Allow more alerts now that we filter them
      };
    }, (prev) => {
      const target = prev.entities.find(e => e.id === id);
      return `${target?.name} ${toGroup ? 'Group' : ''} took ${amount} ${type} damage.`;
    }, type);
  }, [updateState]);

  const applyGroupDamage = useCallback((damageMap, damageType, label) => {
    updateState(prev => {
      let newAlerts = [...prev.alerts];
      const newEntities = prev.entities.map(e => {
        const damageAmount = damageMap[e.id];
        if (damageAmount !== undefined && damageAmount > 0) {
          let newHp = e.hp;
          let newTempHp = e.tempHp;

          if (newTempHp > 0) {
            const absorbed = Math.min(newTempHp, damageAmount);
            newTempHp -= absorbed;
            const remaining = damageAmount - absorbed;
            newHp = Math.max(0, newHp - remaining);
          } else {
            newHp = Math.max(0, newHp - damageAmount);
          }

          // Concentration check
          if (e.concentration && newHp > 0) {
            const dc = Math.max(10, Math.floor(damageAmount / 2));
            newAlerts.push({
              id: generateId(),
              entityId: e.id,
              dc: dc,
              message: `${e.name} must make a DC ${dc} Concentration save!`,
              type: 'concentration'
            });
          }

          return { ...e, hp: newHp, tempHp: newTempHp };
        }
        return e;
      });

      return {
        ...prev,
        entities: newEntities,
        alerts: newAlerts.slice(0, 10),
        logs: (prev.logs || []).slice(0, 100)
      };
    }, label || `Group damage applied.`);
  }, [updateState]);

  const resolveConcentration = useCallback((alertId, success) => {
    setState(prev => {
      const alert = prev.alerts.find(a => a.id === alertId);
      if (!alert) return prev;

      let newEntities = prev.entities;
      if (!success) {
        newEntities = prev.entities.map(e => 
          e.id === alert.entityId ? { ...e, concentration: false } : e
        );
      }

      const newState = {
        ...prev,
        entities: newEntities,
        alerts: prev.alerts.filter(a => a.id !== alertId),
        lastUpdated: Date.now()
      };

      // Add to logs
      const entity = prev.entities.find(e => e.id === alert.entityId);
      const note = success ? `${entity?.name} maintained concentration.` : `${entity?.name} lost concentration!`;
      
      const logEntry = {
        id: generateId(),
        message: note,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        subType: 'concentration'
      };

      // We manually update history here since we aren't using updateState
      const newLogs = [logEntry, ...(prev.logs || [])].slice(0, 100);
      
      const finalState = { ...newState, logs: newLogs };
      const newHistory = prev.history.slice(0, prev.historyPointer + 1);
      newHistory.push({ ...finalState, note: note });

      return {
        ...finalState,
        history: newHistory,
        historyPointer: newHistory.length - 1,
        isHydrated: true
      };
    });
  }, []);

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
          
          if (!e.isPlayer && e.legendaryActionsMax > 0) {
            return { ...e, effects: effects.filter(ef => ef.duration > 0), legendaryActions: e.legendaryActionsMax };
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

  const updateMap = useCallback((mapUpdates) => {
    updateState(prev => ({
      ...prev,
      map: { ...prev.map, ...mapUpdates }
    }));
  }, [updateState]);

  const updateToken = useCallback((entityId, pos, isFinal = true) => {
    updateState(prev => ({
      ...prev,
      map: {
        ...prev.map,
        tokens: { ...prev.map.tokens, [entityId]: pos }
      }
    }), isFinal ? `Moved token.` : null, null, !isFinal);
  }, [updateState]);

  const saveSnapshot = useCallback((name) => {
    updateState(prev => {
      const { history: _, ...cleanState } = prev;
      const newSnapshot = {
        id: generateId(),
        name: name || `Snapshot ${prev.snapshots.length + 1}`,
        timestamp: new Date().toLocaleString(),
        state: cleanState
      };
      return {
        ...prev,
        snapshots: [newSnapshot, ...prev.snapshots].slice(0, 10)
      };
    }, "Tactical snapshot created.");
  }, [updateState]);

  const loadSnapshot = useCallback((id) => {
    updateState(prev => {
      const snapshot = prev.snapshots.find(s => s.id === id);
      if (!snapshot) return prev;
      return {
        ...prev,
        ...snapshot.state,
        snapshots: prev.snapshots // Keep snapshots
      };
    }, "Reverted to tactical snapshot.");
  }, [updateState]);

  const deleteSnapshot = useCallback((id) => {
    updateState(prev => ({
      ...prev,
      snapshots: prev.snapshots.filter(s => s.id !== id)
    }), "Snapshot deleted.");
  }, [updateState]);

  return {
    state,
    addEntity,
    updateEntity,
    removeEntity,
    advanceTurn,
    applyDamage,
    applyGroupDamage,
    applyHealing,
    addAlert,
    clearAlert,
    setEntitiesOrder,
    importState,
    undo,
    redo,
    syncStatus,
    resolveConcentration,
    spendLegendaryAction,
    spendLegendaryResistance,
    duplicateEntity,
    updateMap,
    updateToken,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    exportState,
    addEntityFromTemplate,
    loadEncounter: (encounterData) => {
      const entitiesWithIds = encounterData.entities.map(e => ({
        ...e,
        id: generateId(),
        conditions: e.conditions || [],
        effects: e.effects || [],
        concentration: e.concentration || false,
        tempHp: e.tempHp || 0,
        legendaryActions: e.legendaryActionsMax || 0,
        legendaryResistances: e.legendaryResistancesMax || 0
      }));
      updateState(prev => ({
        ...prev,
        entities: entitiesWithIds.sort((a, b) => b.initiative - a.initiative),
        turnIndex: 0,
        round: 1,
        alerts: [],
        logs: []
      }), `Loaded demo encounter: ${encounterData.name}`);
    },
    canUndo: state.historyPointer > 0,
    canRedo: state.historyPointer < state.history.length - 1,
  };
};
