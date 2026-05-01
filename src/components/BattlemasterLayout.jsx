import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapDisplay from './MapDisplay';
import NowActingPanel from './NowActingPanel';
import InitiativeLedger from './InitiativeLedger';
import BattlemasterQuickActions from './BattlemasterQuickActions';
import DockableWorkspace from './workspace/DockableWorkspace';
import DockablePanel from './workspace/DockablePanel';
import BattlemasterContextDock from './BattlemasterContextDock';
import { useWorkspace } from './workspace/workspaceContext';
import { clampPanelBounds, getPresetPanelSize } from './workspace/panelBounds';

const defaultPanels = () => ({
  left: { id: 'left', title: 'Combat', docked: true, collapsed: false, minimized: false, width: 340, height: 420, left: 80, top: 120, z: 20 },
  right: { id: 'right', title: 'Initiative', docked: true, collapsed: false, minimized: false, width: 380, height: 520, left: 900, top: 100, z: 21 },
  bottom: { id: 'bottom', title: 'Prep Dock', docked: true, collapsed: true, minimized: false, width: 620, height: 230, left: 260, top: 520, z: 22 }
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const BattlemasterLayout = ({ encounter, activeEntity, toggleBestiary, toggleRules, toggleSnapshots, onRegisterReset }) => {
  const [panels, setPanels] = useState(defaultPanels);
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(380);
  const [bottomHeight, setBottomHeight] = useState(230);
  const [isResizing, setIsResizing] = useState(null);
  const { layoutLocked } = useWorkspace();
  const dragRef = useRef({ x: 0, width: 0 });

  const bumpFocus = (id) => {
    setPanels((prev) => {
      const zTop = Math.max(...Object.values(prev).map((p) => p.z || 1)) + 1;
      return { ...prev, [id]: { ...prev[id], z: zTop } };
    });
  };

  const updatePanel = (id, patch) => {
    setPanels((prev) => {
      const current = prev[id];
      if (!current) return prev;
      let next = { ...current, ...patch };
      next = clampPanelBounds(next, { width: window.innerWidth, height: window.innerHeight });
      return { ...prev, [id]: next };
    });
  };

  const redockPanel = (id) => {
    setPanels((prev) => ({ ...prev, [id]: { ...defaultPanels()[id], z: prev[id].z } }));
  };

  const undockPanel = (id) => {
    setPanels((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        docked: false,
        collapsed: false,
        minimized: false,
        left: prev[id].left || 140,
        top: prev[id].top || 120
      }
    }));
  };

  const minimizePanel = (id) => updatePanel(id, { minimized: true });
  const resetPanelPosition = (id) => {
    if (layoutLocked) return;
    setPanels((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const defaults = defaultPanels()[id];
      if (current.docked) return { ...prev, [id]: { ...current, collapsed: defaults.collapsed, minimized: false } };
      return {
        ...prev,
        [id]: {
          ...current,
          collapsed: false,
          minimized: false,
          left: defaults.left,
          top: defaults.top,
          width: defaults.width,
          height: defaults.height
        }
      };
    });
  };

  const applyPresetSize = (id, preset) => {
    if (layoutLocked) return;
    const size = getPresetPanelSize(preset);
    updatePanel(id, { width: size.width, height: size.height, collapsed: false, minimized: false });
  };

  const nudgePanel = (id, direction) => {
    if (layoutLocked) return;
    const delta = 24;
    const offset = {
      up: { x: 0, y: -delta },
      down: { x: 0, y: delta },
      left: { x: -delta, y: 0 },
      right: { x: delta, y: 0 }
    }[direction];
    if (!offset) return;
    setPanels((prev) => {
      const current = prev[id];
      if (!current || current.docked) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          left: current.left + offset.x,
          top: current.top + offset.y
        }
      };
    });
  };

  const resetLayout = useCallback(() => {
    if (!window.confirm('Reset workspace layout? Encounter data will not change.')) return;
    setPanels(defaultPanels());
    setLeftWidth(340);
    setRightWidth(380);
    setBottomHeight(230);
  }, []);

  useEffect(() => {
    onRegisterReset?.(resetLayout);
    return () => onRegisterReset?.(null);
  }, [onRegisterReset, resetLayout]);

  useEffect(() => {
    const onResize = () => {
      setPanels((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.values(prev).forEach((panel) => {
          if (panel.docked || panel.minimized) return;
          const clamped = clampPanelBounds(panel, { width: window.innerWidth, height: window.innerHeight });
          if (clamped.left !== panel.left || clamped.top !== panel.top || clamped.width !== panel.width || clamped.height !== panel.height) {
            next[panel.id] = clamped;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startResize = (kind, event) => {
    if (layoutLocked) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      leftWidth,
      rightWidth,
      bottomHeight
    };
    setIsResizing(kind);
    event.preventDefault();

    const onMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.x;
      const deltaY = moveEvent.clientY - dragRef.current.y;
      if (kind === 'left') setLeftWidth(clamp(dragRef.current.leftWidth + deltaX, 260, 500));
      if (kind === 'right') setRightWidth(clamp(dragRef.current.rightWidth - deltaX, 280, 520));
      if (kind === 'bottom') setBottomHeight(clamp(dragRef.current.bottomHeight - deltaY, 170, 360));
    };

    const onUp = () => {
      setIsResizing(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const leftDockVisible = panels.left.docked && !panels.left.minimized;
  const rightDockVisible = panels.right.docked && !panels.right.minimized;
  const bottomDockVisible = panels.bottom.docked && !panels.bottom.minimized;

  return (
    <DockableWorkspace>
      <div className="flex h-full w-full overflow-hidden">
        <div className="relative flex-1 h-full">
          <div className="flex h-full w-full">
            {leftDockVisible && (
              <div style={{ width: panels.left.collapsed ? 44 : leftWidth }} className="h-full relative">
                <DockablePanel
                  id="left"
                  title="Combat"
                  state={panels.left}
                  onChange={updatePanel}
                  onFocus={bumpFocus}
                  onMinimize={minimizePanel}

                  onRedock={redockPanel}
                  onResetPosition={resetPanelPosition}
                  onUndock={undockPanel}
                  onPresetSize={applyPresetSize}
                  onNudge={nudgePanel}
                  layoutLocked={layoutLocked}
                  className="h-full"
                >
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-custom min-h-0">
                      <NowActingPanel
                        round={encounter.state.round}
                        activeEntity={activeEntity}
                        advanceTurn={encounter.advanceTurn}
                        applyDamage={encounter.applyDamage}
                        applyHealing={encounter.applyHealing}
                        updateEntity={encounter.updateEntity}
                        spendLegendaryAction={encounter.spendLegendaryAction}
                        spendLegendaryResistance={encounter.spendLegendaryResistance}
                      />
                    </div>
                    <BattlemasterQuickActions
                      activeEntity={activeEntity}
                      applyDamage={encounter.applyDamage}
                      applyHealing={encounter.applyHealing}
                    />
                  </div>
                </DockablePanel>
              </div>
            )}

            {leftDockVisible && !panels.left.collapsed && (
              <div
                aria-label="Resize Left Panel"
                className="w-[5px] h-full cursor-col-resize bg-white/5 hover:bg-indigo-500/30"
                onMouseDown={(event) => startResize('left', event)}
              />
            )}

            <div className="flex-1 min-w-0 h-full overflow-hidden">
              <MapDisplay encounter={encounter} />
            </div>

            {rightDockVisible && !panels.right.collapsed && (
              <div
                aria-label="Resize Right Panel"
                className="w-[5px] h-full cursor-col-resize bg-white/5 hover:bg-indigo-500/30"
                onMouseDown={(event) => startResize('right', event)}
              />
            )}

            {rightDockVisible && (
              <div style={{ width: panels.right.collapsed ? 44 : rightWidth }} className="h-full relative">
                <DockablePanel
                  id="right"
                  title="Initiative"
                  state={panels.right}
                  onChange={updatePanel}
                  onFocus={bumpFocus}
                  onMinimize={minimizePanel}

                  onRedock={redockPanel}
                  onResetPosition={resetPanelPosition}
                  onUndock={undockPanel}
                  onPresetSize={applyPresetSize}
                  onNudge={nudgePanel}
                  layoutLocked={layoutLocked}
                  className="h-full"
                >
                  <InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} />
                </DockablePanel>
              </div>
            )}
          </div>

          {bottomDockVisible && (
            <>
              {!panels.bottom.collapsed && (
                <div
                  aria-label="Resize Bottom Dock"
                  className="absolute left-0 right-0 cursor-row-resize h-[5px] bg-white/5 hover:bg-indigo-500/30"
                  style={{ bottom: bottomHeight }}
                  onMouseDown={(event) => startResize('bottom', event)}
                />
              )}
              <div className="absolute left-0 right-0 bottom-0" style={{ height: panels.bottom.collapsed ? 42 : bottomHeight }}>
                <DockablePanel
                  id="bottom"
                  title="Prep Dock"
                  state={panels.bottom}
                  onChange={updatePanel}
                  onFocus={bumpFocus}
                  onMinimize={minimizePanel}

                  onRedock={redockPanel}
                  onResetPosition={resetPanelPosition}
                  onUndock={undockPanel}
                  onPresetSize={applyPresetSize}
                  onNudge={nudgePanel}
                  layoutLocked={layoutLocked}
                  className="h-full"
                >
                  <BattlemasterContextDock
                    toggleBestiary={toggleBestiary}
                    toggleRules={toggleRules}
                    toggleSnapshots={toggleSnapshots}
                    exportState={encounter.exportState}
                    importState={encounter.importState}
                  />
                </DockablePanel>
              </div>
            </>
          )}

          {Object.values(panels)
            .filter((panel) => !panel.docked && !panel.minimized)
            .map((panel) => {
              const content = panel.id === 'left'
                ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-custom min-h-0">
                      <NowActingPanel
                        round={encounter.state.round}
                        activeEntity={activeEntity}
                        advanceTurn={encounter.advanceTurn}
                        applyDamage={encounter.applyDamage}
                        applyHealing={encounter.applyHealing}
                        updateEntity={encounter.updateEntity}
                        spendLegendaryAction={encounter.spendLegendaryAction}
                        spendLegendaryResistance={encounter.spendLegendaryResistance}
                      />
                    </div>
                    <BattlemasterQuickActions
                      activeEntity={activeEntity}
                      applyDamage={encounter.applyDamage}
                      applyHealing={encounter.applyHealing}
                    />
                  </div>
                )
                : panel.id === 'right'
                  ? <InitiativeLedger encounter={encounter} toggleBestiary={toggleBestiary} />
                  : (
                    <BattlemasterContextDock
                      toggleBestiary={toggleBestiary}
                      toggleRules={toggleRules}
                      toggleSnapshots={toggleSnapshots}
                      exportState={encounter.exportState}
                      importState={encounter.importState}
                    />
                  );

              return (
                <DockablePanel
                  key={panel.id}
                  id={panel.id}
                  title={panel.title}
                  state={panel}
                  onChange={updatePanel}
                  onFocus={bumpFocus}
                  onMinimize={minimizePanel}

                  onRedock={redockPanel}
                  onResetPosition={resetPanelPosition}
                  onUndock={undockPanel}
                  onPresetSize={applyPresetSize}
                  onNudge={nudgePanel}
                  layoutLocked={layoutLocked}
                >
                  {content}
                </DockablePanel>
              );
            })}

          {isResizing && (
            <div className="absolute top-2 right-2 z-40 px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[10px] text-slate-300">
              Resize panels from their edges or corners.
            </div>
          )}
        </div>
      </div>
    </DockableWorkspace>
  );
};

export default BattlemasterLayout;
