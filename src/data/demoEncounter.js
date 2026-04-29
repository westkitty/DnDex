export const DEMO_ENCOUNTER = {
  name: "The Obsidian Lair",
  entities: [
    {
      name: "Adult Black Dragon",
      ac: 19,
      hp: 195,
      maxHp: 195,
      initiative: 18,
      isPlayer: false,
      type: "dragon",
      legendaryActions: 3,
      legendaryActionsMax: 3,
      legendaryResistances: 3,
      legendaryResistancesMax: 3,
      stats: { str: 23, dex: 14, con: 21, int: 14, wis: 13, cha: 17 }
    },
    {
      name: "Valerius (Paladin)",
      ac: 21,
      hp: 104,
      maxHp: 104,
      initiative: 12,
      isPlayer: true,
      stats: { str: 18, dex: 10, con: 16, int: 8, wis: 14, cha: 16 }
    },
    {
      name: "Lyra (Ranger)",
      ac: 17,
      hp: 78,
      maxHp: 78,
      initiative: 22,
      isPlayer: true,
      stats: { str: 10, dex: 20, con: 14, int: 12, wis: 16, cha: 10 }
    },
    {
      name: "Kael (Wizard)",
      ac: 15,
      hp: 62,
      maxHp: 62,
      initiative: 15,
      isPlayer: true,
      stats: { str: 8, dex: 14, con: 14, int: 20, wis: 12, cha: 10 }
    }
  ]
};
