/** @vitest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEncounterState } from './useEncounterState';
import { expect, test, describe, vi, beforeEach } from 'vitest';

// Mock IndexedDB
vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve()),
}));

describe('DM Hub State Machine Harness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Initial state hydration', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));
    expect(result.current.state.round).toBe(1);
    expect(result.current.state.entities).toHaveLength(0);
  });

  test('Adding and updating entities', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(true); // Add Hero
    });

    expect(result.current.state.entities).toHaveLength(1);
    expect(result.current.state.entities[0].name).toBe('New Hero');

    const entityId = result.current.state.entities[0].id;
    act(() => {
      result.current.updateEntity(entityId, { hp: 50, maxHp: 50 });
    });

    expect(result.current.state.entities[0].hp).toBe(50);
  });

  test('Damage and healing logic', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(false);
    });

    const id = result.current.state.entities[0].id;
    
    // Test Damage
    act(() => {
      result.current.applyDamage(id, 5, 'Fire');
    });
    expect(result.current.state.entities[0].hp).toBe(5);
    expect(result.current.state.logs[0].message).toContain('took 5 Fire damage');

    // Test Healing
    act(() => {
      result.current.applyHealing(id, 3);
    });
    expect(result.current.state.entities[0].hp).toBe(8);
  });

  test('Turn advancement and turn-based effect ticking', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(true); // Index 0
      result.current.addEntity(false); // Index 1
    });

    const entity1 = result.current.state.entities[0];
    
    // Add effect that ticks on start
    act(() => {
      result.current.updateEntity(entity1.id, { 
        effects: [{ id: '1', name: 'Poison', duration: 2, tickOn: 'start' }] 
      });
    });

    // Advance turn to next entity
    act(() => {
      result.current.advanceTurn(1);
    });

    expect(result.current.state.turnIndex).toBe(1);
    
    // Advance again (Back to entity 0, new round)
    act(() => {
      result.current.advanceTurn(1);
    });

    expect(result.current.state.round).toBe(2);
    expect(result.current.state.turnIndex).toBe(0);
    
    // Effect should have ticked down
    expect(result.current.state.entities[0].effects[0].duration).toBe(1);
  });

  test('History (Undo/Redo) integrity', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(true);
    });

    expect(result.current.state.entities).toHaveLength(1);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state.entities).toHaveLength(0);

    act(() => {
      result.current.redo();
    });

    expect(result.current.state.entities).toHaveLength(1);
  });

  test('Reordering entities maintains active turn index', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(true); // Hero A
      result.current.addEntity(true); // Hero B (Index 1)
    });

    // Set turn to Hero B
    act(() => {
      result.current.advanceTurn(1);
    });
    expect(result.current.state.turnIndex).toBe(1);

    // Swap Hero A and Hero B
    const b = result.current.state.entities[1];
    const a = result.current.state.entities[0];
    
    act(() => {
      result.current.setEntitiesOrder([b, a]);
    });

    expect(result.current.state.entities[0].id).toBe(b.id);
    // turnIndex should update to follow Hero B to Index 0
    expect(result.current.state.turnIndex).toBe(0);
  });

  test('Undoing damage correctly reverts HP and history', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(false); // Add Monster (HP 10)
    });

    const id = result.current.state.entities[0].id;

    act(() => {
      result.current.applyDamage(id, 5, 'Slashing');
    });

    expect(result.current.state.entities[0].hp).toBe(5);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state.entities[0].hp).toBe(10);
    expect(result.current.state.historyPointer).toBe(1); // Back to 'Add Monster' state
  });

  test('Resolving concentration failures correctly updates state', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    act(() => {
      result.current.addEntity(false);
    });

    const id = result.current.state.entities[0].id;

    act(() => {
      result.current.updateEntity(id, { concentration: true });
      result.current.applyDamage(id, 10, 'Slashing');
    });

    const alert = result.current.state.alerts.find(a => a.type === 'concentration');
    expect(alert).toBeDefined();
    expect(alert.dc).toBe(10);

    act(() => {
      result.current.resolveConcentration(alert.id, false); // Fail
    });

    expect(result.current.state.entities[0].concentration).toBe(false);
    expect(result.current.state.alerts.find(a => a.id === alert.id)).toBeUndefined();
  });

  test('importState updates entities and does not crash', async () => {
    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    const importedState = {
      entities: [{ id: 'hero1', name: 'Imported Hero', type: 'player', hp: 50, maxHp: 50 }],
      round: 5,
      turnIndex: 0
    };

    act(() => {
      result.current.importState(importedState);
    });

    expect(result.current.state.entities).toHaveLength(1);
    expect(result.current.state.entities[0].name).toBe('Imported Hero');
    expect(result.current.state.round).toBe(5);
  });

  test('BroadcastChannel sync preserves local history and does not crash', async () => {
    // 1. Setup BroadcastChannel mock to capture the listener
    let onMessageListener = null;
    const mockChannel = {
      close: vi.fn(),
      get onmessage() { return onMessageListener; },
      set onmessage(val) { onMessageListener = val; }
    };
    
    // Mock constructor
    const BroadcastChannelMock = function() {
      return mockChannel;
    };
    vi.stubGlobal('BroadcastChannel', BroadcastChannelMock);

    const { result } = renderHook(() => useEncounterState());
    await waitFor(() => expect(result.current.state.isHydrated).toBe(true));

    // 2. Initial state has history
    expect(result.current.state.history).toBeDefined();
    expect(result.current.state.history.length).toBeGreaterThan(0);
    const initialHistoryLength = result.current.state.history.length;

    // 3. Simulate incoming message with stripped state (no history)
    const remoteState = {
      entities: [{ id: '1', name: 'Remote Monster' }],
      lastUpdated: Date.now() + 1000,
      round: 10,
      turnIndex: 5
      // history is missing
    };

    act(() => {
      onMessageListener({ data: remoteState });
    });

    // 4. Assert: State updated but history preserved
    expect(result.current.state.round).toBe(10);
    expect(result.current.state.entities[0].name).toBe('Remote Monster');
    expect(result.current.state.history).toBeDefined();
    expect(result.current.state.history.length).toBe(initialHistoryLength);
    expect(result.current.canRedo).toBe(false); // Should not crash
  });
});
