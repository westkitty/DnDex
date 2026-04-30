const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const PANEL_PRESETS = {
  compact: { width: 280, height: 220 },
  standard: { width: 360, height: 320 },
  large: { width: 460, height: 430 }
};

export const getPresetPanelSize = (preset) => PANEL_PRESETS[preset] ?? PANEL_PRESETS.standard;

export const clampPanelBounds = (panel, viewport, minimumVisible = 56, topInset = 48) => {
  if (!panel || panel.docked) return panel;

  const width = Math.max(panel.width ?? PANEL_PRESETS.standard.width, 220);
  const height = Math.max(panel.height ?? PANEL_PRESETS.standard.height, 160);

  const minLeft = minimumVisible - width;
  const maxLeft = Math.max(minimumVisible, viewport.width - minimumVisible);
  const minTop = topInset + minimumVisible - height;
  const maxTop = Math.max(topInset + minimumVisible, viewport.height - minimumVisible);

  return {
    ...panel,
    width,
    height,
    left: clamp(panel.left ?? 0, minLeft, maxLeft),
    top: clamp(panel.top ?? topInset, minTop, maxTop)
  };
};
