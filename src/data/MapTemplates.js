export const MAP_TEMPLATES = {
  FOREST_CLEARING: {
    id: 'forest-clearing',
    name: "Forest Clearing",
    baseTile: "grass_lush",
    dimensions: { width: 30, height: 30 },
    decorations: [
      { id: 'tree-1', type: 'object', assetId: 'tree_oak', x: 5, y: 5, scale: 2 },
      { id: 'tree-2', type: 'object', assetId: 'tree_oak', x: 22, y: 6, scale: 2.2 },
      { id: 'rock-1', type: 'object', assetId: 'rock_mossy', x: 12, y: 18, scale: 1.2 },
      { id: 'bush-1', type: 'object', assetId: 'bush_green', x: 18, y: 15, scale: 1 },
      { id: 'bush-2', type: 'object', assetId: 'bush_green', x: 8, y: 12, scale: 0.8 },
    ]
  },
  DUNGEON_CHAMBER: {
    id: 'dungeon-chamber',
    name: "Dungeon Chamber",
    baseTile: "dungeon_stone",
    dimensions: { width: 20, height: 20 },
    decorations: [
      { id: 'pillar-1', type: 'object', assetId: 'stone_pillar', x: 5, y: 5, scale: 1 },
      { id: 'pillar-2', type: 'object', assetId: 'stone_pillar', x: 14, y: 5, scale: 1 },
      { id: 'pillar-3', type: 'object', assetId: 'stone_pillar', x: 5, y: 14, scale: 1 },
      { id: 'pillar-4', type: 'object', assetId: 'stone_pillar', x: 14, y: 14, scale: 1 },
      { id: 'rug-1', type: 'object', assetId: 'ornate_rug', x: 9, y: 8, scale: 2 },
    ]
  },
  TAVERN_FLOOR: {
    id: 'tavern-floor',
    name: "Small Tavern",
    baseTile: "wood_plank",
    dimensions: { width: 15, height: 15 },
    decorations: [
      { id: 'table-1', type: 'object', assetId: 'wood_table', x: 3, y: 3, scale: 1 },
      { id: 'table-2', type: 'object', assetId: 'wood_table', x: 3, y: 10, scale: 1 },
      { id: 'bar-1', type: 'object', assetId: 'wood_bar', x: 11, y: 4, scale: 1.5 },
      { id: 'chair-1', type: 'object', assetId: 'wood_chair', x: 2, y: 3, scale: 0.5 },
      { id: 'chair-2', type: 'object', assetId: 'wood_chair', x: 4, y: 3, scale: 0.5 },
    ]
  }
};
