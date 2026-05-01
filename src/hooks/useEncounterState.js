import { useState, useEffect, useCallback, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { combatEngine, generateId } from '../utils/combatEngine';

// --- CONSTANTS ---
const SYNC_CHANNEL = "dm-hub-sync";

const INITIAL_STATE = {
  round: 1,
  turnIndex: 0,
  entities: [],
  alerts: [],
  logs: [],
  history: [], 
  historyPointer: -1,
  lastUpdated: Date.now(),
  map: {
    drawing: [],
    tokens: {},
    view: { x: 0, y: 0, zoom: 1 },
    terrain: {},
    objects: [],
    fog: {},
    background: { dataUrl: null, opacity: 1, visible: true },
    config: {
      gridVisible: true,
      gridSize: 50,
      width: 30,
      height: 30,
      baseTile: null,
      customAssets: {}
    }
  },
  snapshots: []
};

/**
 * SYNC MACHINE STATES
 */
const SYNC_STATES = {
  IDLE: 'saved',
  SAVING: 'saving',
  CONFLICT: 'conflict',
  ERROR: 'error'
};

export const useEncounterState = () => {
  const [state, setState] = useState(() => ({ ...INITIAL_STATE, isHydrated: false }));
  const [syncStatus, setSyncStatus] = useState(SYNC_STATES.IDLE);
  
  // Refs for stable state access in effects/callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  /**
   * PERSISTENCE LAYER: Multi-tab Sync
   */
  useEffect(() => {
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channel.onmessage = (event) => {
      const remoteState = event.data;
      if (remoteState.lastUpdated > stateRef.current.lastUpdated) {
        setState(prev => ({ ...prev, ...remoteState, isHydrated: true }));
      }
    };
    return () => channel.close();
  }, []);

  /**
   * PERSISTENCE LAYER: IndexedDB Hydration
   */
  useEffect(() => {
    get('dm-hub-state').then(saved => {
      if (saved) {
        setState({ ...saved, history: [saved], historyPointer: 0, isHydrated: true });
      } else {
        setState(prev => ({ ...prev, history: [INITIAL_STATE], historyPointer: 0, isHydrated: true }));
      }
    });
  }, []);

  /**
   * PERSISTENCE LAYER: Auto-Save
   */
  useEffect(() => {
    if (!state.isHydrated) return;
    
    const saveToDisk = async () => {
      setSyncStatus(SYNC_STATES.SAVING);
      try {
        const diskState = await get('dm-hub-state');
        // Simple conflict detection based on timestamp
        if (diskState && diskState.lastUpdated > state.lastUpdated) {
          setSyncStatus(SYNC_STATES.CONFLICT);
          return;
        }

        const { history: _, historyPointer: __, isHydrated: ___, ...toSave } = state;
        await set('dm-hub-state', toSave);
        
        const channel = new BroadcastChannel(SYNC_CHANNEL);
        channel.postMessage({ ...toSave, isHydrated: true });
        channel.close();
        
        setSyncStatus(SYNC_STATES.IDLE);
      } catch {
        setSyncStatus(SYNC_STATES.ERROR);
      }
    };

    const debounce = setTimeout(saveToDisk, 500);
    return () => clearTimeout(debounce);
  }, [state.lastUpdated, state.isHydrated]);

  /**
   * CORE REDUCER: Handles State Transitions, Logging, and History
   */
  const updateState = useCallback((updater, logMessage = null, options = {}) => {
    const { skipHistory = false, subType = null } = options;

    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      // Structural equality check to avoid redundant renders
      const { history: _, historyPointer: __, isHydrated: ___, logs: ____, lastUpdated: _____, ...cleanNew } = newState;
      const { history: _h, historyPointer: _p, isHydrated: _hy, logs: _l, lastUpdated: _lu, ...cleanPrev } = prev;
      if (JSON.stringify(cleanNew) === JSON.stringify(cleanPrev)) return prev;

      // Log Management
      let newLogs = prev.logs || [];
      const messageText = typeof logMessage === 'function' ? logMessage(prev, newState) : logMessage;
      
      if (messageText) {
        newLogs = [{ 
          id: generateId(), 
          message: messageText, 
          timestamp: new Date().toLocaleTimeString(),
          round: prev.round,
          type: messageText.includes('damage') ? 'damage' : messageText.includes('heal') ? 'heal' : 'info',
          subType
        }, ...newLogs].slice(0, 100);
      }

      const finalizedState = { ...newState, logs: newLogs, lastUpdated: Date.now(), isHydrated: true };

      if (skipHistory) {
        return { ...finalizedState, history: prev.history, historyPointer: prev.historyPointer };
      }

      const { history: _hist, historyPointer: _ptr, ...sanitizedSnapshot } = finalizedState;
      const newHistory = prev.history.slice(0, prev.historyPointer + 1);
      newHistory.push({ ...sanitizedSnapshot, note: messageText });
      const cappedHistory = newHistory.slice(-50);
      
      return { 
        ...finalizedState, 
        history: cappedHistory, 
        historyPointer: cappedHistory.length - 1 
      };
    });
  }, []);

  /**
   * DOMAIN ACTIONS: Initiative & Turns
   */
  const advanceTurn = useCallback((direction = 1) => {
    updateState(
      prev => combatEngine.advanceTurn(prev, direction),
      (prev, next) => {
        const nextActive = next.entities[next.turnIndex];
        return direction > 0 
          ? `Turn advanced to ${nextActive?.name} (R${next.round})` 
          : `Turn reverted to ${nextActive?.name}`;
      }
    );
  }, [updateState]);

  const setEntitiesOrder = useCallback((newOrder) => {
    updateState(prev => {
      const activeId = prev.entities[prev.turnIndex]?.id;
      const newTurnIndex = newOrder.findIndex(e => e.id === activeId);
      return { ...prev, entities: newOrder, turnIndex: newTurnIndex === -1 ? 0 : newTurnIndex };
    }, "Initiative order reorganized.");
  }, [updateState]);

  /**
   * DOMAIN ACTIONS: Damage & Healing
   */
  const applyDamage = useCallback((id, amount, type, toGroup = false) => {
    updateState(
      prev => {
        const target = prev.entities.find(e => e.id === id);
        const targetIds = toGroup && target?.groupId 
          ? prev.entities.filter(e => e.groupId === target.groupId).map(e => e.id)
          : [id];

        const newEntities = combatEngine.applyDamage(prev.entities, targetIds, amount, type);
        let newAlerts = [...prev.alerts];
        
        // Concentration checks for all affected targets
        prev.entities.forEach(e => {
          if (targetIds.includes(e.id) && e.concentration && amount > 0) {
            const dc = Math.max(10, Math.floor(amount / 2));
            newAlerts.push({
              id: generateId(),
              entityId: e.id,
              dc,
              message: `${e.name} Concentration Check (DC ${dc})`,
              type: 'concentration'
            });
          }
        });
        
        return { ...prev, entities: newEntities, alerts: newAlerts.slice(-10) };
      },
      (prev) => {
        const target = prev.entities.find(e => e.id === id);
        return `${target?.name}${toGroup ? ' Group' : ''} took ${amount} ${type} damage.`;
      },
      { subType: type }
    );
  }, [updateState]);

  const applyBulkDamage = useCallback((damageMap, type, logMessage) => {
    updateState(
      prev => {
        let newEntities = [...prev.entities];
        let newAlerts = [...prev.alerts];

        Object.entries(damageMap).forEach(([id, amount]) => {
          // B03 FIX: pass [id] (array) not id (string) to combatEngine.applyDamage
          newEntities = combatEngine.applyDamage(newEntities, [id], amount, type);
          
          // Concentration check
          const entity = prev.entities.find(e => e.id === id);
          if (entity?.concentration && amount > 0) {
            const dc = Math.max(10, Math.floor(amount / 2));
            newAlerts.push({
              id: generateId(),
              entityId: id,
              dc,
              message: `${entity.name} Concentration Check (DC ${dc})`,
              type: 'concentration'
            });
          }
        });

        return { ...prev, entities: newEntities, alerts: newAlerts.slice(-10) };
      },
      logMessage || "Area damage resolved.",
      { subType: type }
    );
  }, [updateState]);

  const applyHealing = useCallback((id, amount, toGroup = false) => {
    updateState(
      prev => {
        const target = prev.entities.find(e => e.id === id);
        const targetIds = toGroup && target?.groupId 
          ? prev.entities.filter(e => e.groupId === target.groupId).map(e => e.id)
          : [id];
        return { ...prev, entities: combatEngine.applyHealing(prev.entities, targetIds, amount) };
      },
      (prev) => {
        const target = prev.entities.find(e => e.id === id);
        return `${target?.name}${toGroup ? ' Group' : ''} healed for ${amount} HP.`;
      },
      { subType: 'heal' }
    );
  }, [updateState]);

  /**
   * HISTORY ACTIONS
   */
  const undo = useCallback(() => {
    const note = stateRef.current.history[stateRef.current.historyPointer]?.note || "Action";
    setState(prev => {
      if (prev.historyPointer > 0) {
        const nextPointer = prev.historyPointer - 1;
        return { ...prev.history[nextPointer], history: prev.history, historyPointer: nextPointer };
      }
      return prev;
    });
    return note;
  }, []);

  const redo = useCallback(() => {
    // B05 FIX: use functional setState to avoid stale closure on state.historyPointer
    let note = "";
    setState(prev => {
      if (prev.historyPointer < prev.history.length - 1) {
        const nextPointer = prev.historyPointer + 1;
        note = prev.history[nextPointer]?.note || "Action";
        return { ...prev.history[nextPointer], history: prev.history, historyPointer: nextPointer };
      }
      return prev;
    });
    return note;
  }, []);

  /**
   * ENTITY LIFECYCLE
   */
  const addEntity = useCallback((isPlayer = false) => {
    const name = isPlayer ? 'New Hero' : 'New Foe';
    const newEntity = {
      id: generateId(),
      name,
      isPlayer,
      hp: 10, maxHp: 10, tempHp: 0,
      ac: 10, initiative: 10,
      conditions: [], effects: [], concentration: false,
      pos: { x: 0, y: 0 }
    };

    updateState(prev => ({
      ...prev,
      entities: combatEngine.sortInitiative([...prev.entities, newEntity])
    }), `Recruited ${name} to the field.`);
  }, [updateState]);

  const updateEntity = useCallback((id, updates) => {
    updateState(
      prev => ({ ...prev, entities: prev.entities.map(e => e.id === id ? { ...e, ...updates } : e) }),
      (prev) => {
        const entity = prev.entities.find(e => e.id === id);
        return updates.name ? `Renamed ${entity?.name} to ${updates.name}` : `Modified ${entity?.name}`;
      }
    );
  }, [updateState]);

  const removeEntity = useCallback((id) => {
    updateState(
      prev => ({ ...prev, entities: prev.entities.filter(e => e.id !== id) }),
      "Entity purged from timeline."
    );
  }, [updateState]);

  const addEntityFromTemplate = useCallback((template) => {
    const newEntity = {
      ...template,
      id: generateId(),
      isPlayer: false,
      initiative: 10,
      conditions: [],
      effects: [],
      concentration: false,
      legendaryActions: template.legendaryActionsMax || 0,
      legendaryResistances: template.legendaryResistancesMax || 0,
      pos: { x: 0, y: 0 }
    };

    updateState(prev => ({
      ...prev,
      entities: combatEngine.sortInitiative([...prev.entities, newEntity])
    }), `Summoned ${template.name} from the aether.`);
  }, [updateState]);

  /**
   * DOMAIN ACTIONS: Utility & Import/Export
   */
  const importState = useCallback((imported) => {
    try {
      if (!imported || !Array.isArray(imported.entities)) {
        console.error("Invalid encounter schema: missing entities array.");
        return false;
      }
      
      updateState((prev) => {
        const importedConfig = imported.map?.config || {};
        const normalizedCustomAssets = importedConfig.customAssets && typeof importedConfig.customAssets === 'object'
          ? importedConfig.customAssets
          : {};
        return {
        ...INITIAL_STATE,
        ...imported,
        map: {
          ...INITIAL_STATE.map,
          ...(imported.map || {}),
          config: {
            ...INITIAL_STATE.map.config,
            ...importedConfig,
            customAssets: normalizedCustomAssets
          }
        },
        snapshots: prev.snapshots,
        isHydrated: true
      };
      }, "Encounter restored from external source.");
      return true;
    } catch (err) {
      console.error("Failed to parse encounter data:", err);
      return false;
    }
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

  /**
   * ENTITY ACTIONS: Special Resources
   */
  const duplicateEntity = useCallback((id) => {
    updateState(prev => {
      const entity = prev.entities.find(e => e.id === id);
      if (!entity) return prev;
      
      const baseName = entity.name.replace(/\s\d+$/, '').trim();
      const sameBase = prev.entities.filter(e => e.name.startsWith(baseName));
      const maxNum = sameBase.reduce((max, e) => {
        const match = e.name.match(/\s(\d+)$/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      
      const cloned = { 
        ...entity, 
        id: generateId(), 
        name: `${baseName} ${maxNum + 1}`, 
        hp: entity.maxHp, 
        tempHp: 0, 
        conditions: [], 
        effects: [], 
        concentration: false,
        pos: entity.pos ? { x: entity.pos.x + 1, y: entity.pos.y + 1 } : { x: 0, y: 0 }
      };
      return { ...prev, entities: combatEngine.sortInitiative([...prev.entities, cloned]) };
    }, (prev) => `Duplicated ${prev.entities.find(e => e.id === id)?.name}.`);
  }, [updateState]);

  const spendLegendaryAction = useCallback((id) => {
    updateState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === id ? { ...e, legendaryActions: Math.max(0, e.legendaryActions - 1) } : e)
    }), (prev) => `${prev.entities.find(e => e.id === id)?.name} spent a Legendary Action.`, { subType: 'legendary' });
  }, [updateState]);

  const spendLegendaryResistance = useCallback((id) => {
    updateState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === id ? { ...e, legendaryResistances: Math.max(0, e.legendaryResistances - 1) } : e)
    }), (prev) => `${prev.entities.find(e => e.id === id)?.name} spent a Legendary Resistance!`, { subType: 'resistance' });
  }, [updateState]);

  /**
   * MAP ACTIONS: View only (no history — pan/zoom are not meaningfully undoable)
   */
  const updateMap = useCallback((updates) => {
    updateState(prev => ({ ...prev, map: { ...prev.map, ...updates } }), null, { skipHistory: true });
  }, [updateState]);

  const updateToken = useCallback((entityId, pos, isFinal = true) => {
    updateState(prev => ({
      ...prev,
      map: { ...prev.map, tokens: { ...prev.map.tokens, [entityId]: pos } }
    }), isFinal ? `Moved token.` : null, { skipHistory: !isFinal });
  }, [updateState]);

  /**
   * MAP ACTIONS: Terrain & Objects (with history — undoable)
   */
  const commitTerrain = useCallback((terrainUpdates) => {
    const count = Object.keys(terrainUpdates).length;
    updateState(
      prev => ({ ...prev, map: { ...prev.map, terrain: { ...prev.map.terrain, ...terrainUpdates } } }),
      `Terrain painted (${count} tile${count !== 1 ? 's' : ''}).`
    );
  }, [updateState]);

  const placeObject = useCallback((assetId, x, y, scale = 1, rotation = 0) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, objects: [...prev.map.objects, { id: generateId(), assetId, x, y, scale, rotation }] } }),
      `Object placed on battlefield.`
    );
  }, [updateState]);

  const addCustomMapAsset = useCallback((asset) => {
    if (!asset?.id || !asset?.dataUrl) return;
    updateState(
      prev => ({
        ...prev,
        map: {
          ...prev.map,
          config: {
            ...prev.map.config,
            customAssets: {
              ...(prev.map.config?.customAssets || {}),
              [asset.id]: asset
            }
          }
        }
      }),
      `Added custom map asset: ${asset.name || asset.id}.`
    );
  }, [updateState]);

  const removeCustomMapAsset = useCallback((assetId) => {
    updateState(
      prev => {
        const nextAssets = { ...(prev.map.config?.customAssets || {}) };
        delete nextAssets[assetId];
        return {
          ...prev,
          map: {
            ...prev.map,
            config: {
              ...prev.map.config,
              customAssets: nextAssets
            }
          }
        };
      },
      `Removed custom map asset: ${assetId}.`
    );
  }, [updateState]);

  const removeObject = useCallback((objectId) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, objects: prev.map.objects.filter(obj => obj.id !== objectId) } }),
      "Object removed from battlefield."
    );
  }, [updateState]);

  const applyTemplate = useCallback((template) => {
    updateState(
      prev => ({
        ...prev,
        map: {
          ...prev.map,
          terrain: {},
          objects: template.decorations.map(d => ({ ...d, id: generateId() })),
          config: { ...prev.map.config, width: template.dimensions.width, height: template.dimensions.height, baseTile: template.baseTile }
        }
      }),
      `Applied map template: ${template.name}.`
    );
  }, [updateState]);

  const clearMap = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...INITIAL_STATE.map } }),
      "Battlefield sanitized."
    );
  }, [updateState]);

  /**
   * MAP ACTIONS: Drawing (with history)
   */
  const commitDrawing = useCallback((path) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, drawing: [...(prev.map.drawing || []), path] } }),
      "Tactical sketch added."
    );
  }, [updateState]);

  const clearMapDrawing = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, drawing: [] } }),
      "Tactical sketches cleared."
    );
  }, [updateState]);

  /**
   * MAP ACTIONS: Fog of War (with history)
   */
  const setFogCell = useCallback((x, y, hidden) => {
    updateState(
      prev => {
        const key = `${x},${y}`;
        const newFog = { ...prev.map.fog };
        if (hidden) {
          newFog[key] = true;
        } else {
          delete newFog[key];
        }
        return { ...prev, map: { ...prev.map, fog: newFog } };
      },
      hidden ? `Fog applied at (${x},${y}).` : `Fog lifted at (${x},${y}).`
    );
  }, [updateState]);

  const clearFog = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, fog: {} } }),
      "Fog of war lifted."
    );
  }, [updateState]);

  /**
   * MAP ACTIONS: Background Image
   */
  const setMapBackground = useCallback((dataUrl) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, background: { ...prev.map.background, dataUrl, visible: true } } }),
      "Battle map background uploaded."
    );
  }, [updateState]);

  const clearMapBackground = useCallback(() => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, background: { dataUrl: null, opacity: 1, visible: true } } }),
      "Battle map background removed."
    );
  }, [updateState]);

  const setBackgroundOpacity = useCallback((opacity) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, background: { ...prev.map.background, opacity } } }),
      null, { skipHistory: true }
    );
  }, [updateState]);

  const setBackgroundVisible = useCallback((visible) => {
    updateState(
      prev => ({ ...prev, map: { ...prev.map, background: { ...prev.map.background, visible } } }),
      null, { skipHistory: true }
    );
  }, [updateState]);

  /**
   * SNAPSHOTS
   */
  const saveSnapshot = useCallback((name) => {
    updateState(prev => {
      const { history: _, ...clean } = prev;
      const snap = { id: generateId(), name: name || `Echo ${prev.snapshots.length + 1}`, timestamp: new Date().toLocaleString(), state: clean };
      return { ...prev, snapshots: [snap, ...prev.snapshots].slice(0, 10) };
    }, "Temporal snapshot archived.");
  }, [updateState]);

  const loadSnapshot = useCallback((id) => {
    updateState(prev => {
      const snap = prev.snapshots.find(s => s.id === id);
      return snap ? { ...prev, ...snap.state, snapshots: prev.snapshots } : prev;
    }, "Restored from temporal snapshot.");
  }, [updateState]);

  const deleteSnapshot = useCallback((id) => {
    updateState(prev => ({ ...prev, snapshots: prev.snapshots.filter(s => s.id !== id) }), "Snapshot deleted.");
  }, [updateState]);

  // B17 FIX: removed duplicate clearAlert here — the canonical version is inline in the return object below (skipHistory: true)

  const triggerLairAction = useCallback(() => {
    // B02 FIX: push a visible alert so the DM knows to describe lair action effects
    updateState(prev => ({
      ...prev,
      alerts: [
        ...prev.alerts,
        {
          id: generateId(),
          message: "Lair Action: Count 20 — Describe environmental effect!",
          type: 'warning'
        }
      ].slice(-10)
    }), "Lair Action triggered: Environmental hazard activated.");
  }, [updateState]);

  const resetMap = useCallback(() => {
    updateState(prev => ({ ...prev, map: INITIAL_STATE.map }), "Battlefield reset.");
  }, [updateState]);

  const clearEncounter = useCallback(() => {
    // B13 FIX: preserve snapshots across encounter wipe
    updateState(prev => ({ ...INITIAL_STATE, snapshots: prev.snapshots, isHydrated: true }), "Encounter wiped.");
  }, [updateState]);

  const loadEncounter = useCallback((encounterData) => {
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
      entities: combatEngine.sortInitiative(entitiesWithIds),
      turnIndex: 0,
      round: 1
    }), `Loaded encounter: ${encounterData.name || 'Battle Ready'}`);
  }, [updateState]);

  // B08 FIX: expose clearLogs so RulesPanel doesn't need raw updateState
  const clearLogs = useCallback(() => {
    updateState(prev => ({ ...prev, logs: [] }), "Audit log purged.", { skipHistory: true });
  }, [updateState]);

  return {
    state,
    syncStatus,
    addEntity,
    updateEntity,
    removeEntity,
    addEntityFromTemplate,
    duplicateEntity,
    advanceTurn,
    applyDamage,
    applyBulkDamage,
    applyHealing,
    setEntitiesOrder,
    spendLegendaryAction,
    spendLegendaryResistance,
    updateMap,
    updateToken,
    commitTerrain,
    placeObject,
    addCustomMapAsset,
    removeCustomMapAsset,
    removeObject,
    applyTemplate,
    clearMap,
    commitDrawing,
    clearMapDrawing,
    setFogCell,
    clearFog,
    setMapBackground,
    clearMapBackground,
    setBackgroundOpacity,
    setBackgroundVisible,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    importState,
    exportState,
    loadEncounter,
    resetMap,
    clearEncounter,
    triggerLairAction,
    clearLogs,
    undo,
    redo,
    canUndo: state.historyPointer > 0,
    canRedo: state.historyPointer < state.history.length - 1,
    clearAlert: (id) => updateState(prev => ({ ...prev, alerts: prev.alerts.filter(a => a.id !== id) }), null, { skipHistory: true }),
    resolveConcentration: (alertId, success) => {
      updateState(
        prev => {
          const alert = prev.alerts.find(a => a.id === alertId);
          if (!alert) return prev;
          const entityId = alert.entityId;
          
          return { 
            ...prev, 
            entities: prev.entities.map(e => e.id === entityId && !success ? { ...e, concentration: false } : e),
            alerts: prev.alerts.filter(a => a.id !== alertId)
          };
        },
        (prev) => {
          const alert = prev.alerts.find(a => a.id === alertId);
          const entity = prev.entities.find(e => e.id === alert?.entityId);
          return success ? `${entity?.name} held focus.` : `${entity?.name} broke focus!`;
        }
      );
    }
  };
};
