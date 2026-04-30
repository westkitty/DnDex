import { describe, expect, it } from 'vitest';
import { clampPanelBounds, getPresetPanelSize } from './panelBounds';

describe('panelBounds', () => {
  it('returns preset sizes', () => {
    expect(getPresetPanelSize('compact')).toEqual({ width: 280, height: 220 });
    expect(getPresetPanelSize('unknown')).toEqual({ width: 360, height: 320 });
  });

  it('clamps floating panel back into visible viewport area', () => {
    const panel = {
      id: 'left',
      docked: false,
      width: 420,
      height: 300,
      left: 1200,
      top: 900
    };

    const clamped = clampPanelBounds(panel, { width: 1024, height: 768 });
    expect(clamped.left).toBeLessThanOrEqual(968);
    expect(clamped.top).toBeLessThanOrEqual(712);
  });

  it('does not modify docked panels', () => {
    const panel = { id: 'right', docked: true, width: 340, height: 400, left: 100, top: 100 };
    expect(clampPanelBounds(panel, { width: 900, height: 600 })).toBe(panel);
  });
});
