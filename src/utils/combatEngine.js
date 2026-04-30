/**
 * COMBAT ENGINE: Pure Functions
 * This module contains the core business logic for D&D encounter management.
 * All functions are pure and return a new state object.
 */

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const combatEngine = {
  /**
   * Updates entities HP with consideration for Temp HP, Resistances, and Vulnerabilities.
   * Supports single target or group targeting.
   */
  applyDamage: (entities, targetIds, amount, type) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    return entities.map(e => {
      if (!ids.includes(e.id)) return e;

      let actualDamage = amount;
      if (e.immunities?.includes(type)) actualDamage = 0;
      else if (e.vulnerabilities?.includes(type)) actualDamage *= 2;
      else if (e.resistances?.includes(type)) actualDamage = Math.floor(actualDamage / 2);

      let remainingDamage = actualDamage;
      let newTempHp = e.tempHp || 0;
      
      if (newTempHp > 0) {
        const absorbed = Math.min(newTempHp, remainingDamage);
        newTempHp -= absorbed;
        remainingDamage -= absorbed;
      }

      const newHp = Math.max(0, e.hp - remainingDamage);
      return { ...e, hp: newHp, tempHp: newTempHp };
    });
  },

  applyHealing: (entities, targetIds, amount) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    return entities.map(e => {
      if (!ids.includes(e.id)) return e;
      return { ...e, hp: Math.min(e.maxHp, e.hp + amount) };
    });
  },

  /**
   * Advances the turn, handling legendary actions reset and effect ticking.
   */
  advanceTurn: (state, direction = 1) => {
    if (state.entities.length === 0) return state;

    let newIndex = state.turnIndex + direction;
    let newRound = state.round;

    if (newIndex >= state.entities.length) {
      newIndex = 0;
      newRound += 1;
    } else if (newIndex < 0) {
      newIndex = state.entities.length - 1;
      newRound = Math.max(1, newRound - 1);
    }

    const prevActive = state.entities[state.turnIndex];
    const nextActive = state.entities[newIndex];

    const updatedEntities = state.entities.map(e => {
      let effects = [...(e.effects || [])];
      
      // End of turn ticks
      if (e.id === prevActive?.id && direction === 1) {
        effects = effects.map(ef => ef.tickOn === 'end' ? { ...ef, duration: ef.duration - 1 } : ef);
      }
      
      // Start of turn ticks
      if (e.id === nextActive?.id && direction === 1) {
        effects = effects.map(ef => ef.tickOn === 'start' ? { ...ef, duration: ef.duration - 1 } : ef);
        
        // Reset Legendary Actions for Monsters
        if (!e.isPlayer && e.legendaryActionsMax > 0) {
          return { 
            ...e, 
            effects: effects.filter(ef => ef.duration > 0), 
            legendaryActions: e.legendaryActionsMax 
          };
        }
      }
      
      return { ...e, effects: effects.filter(ef => ef.duration > 0) };
    });

    return {
      ...state,
      round: newRound,
      turnIndex: newIndex,
      entities: updatedEntities
    };
  },

  sortInitiative: (entities) => {
    return [...entities].sort((a, b) => b.initiative - a.initiative);
  }
};
