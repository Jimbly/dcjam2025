/* eslint-disable @stylistic/max-len */
import { StatsData } from './entity_demo_client';

export type ItemType = 'head' | 'torso' | 'weapon' | 'offhand' | 'consumable' | 'key';
export type ItemDef = {
  item_type: ItemType;
  name: string;
  stats: Partial<StatsData>;
  desc: string;
};

type ItemRow = [ItemType, string, string, Partial<StatsData>?, string?];
const ITEM_ROWS: ItemRow[] = [
  ['head', 'helmetfree', 'T0 Cocky Rooster', { hp_max: 5 }, 'Have you ever tried to catch a chicken?  Well, then you know how fast these little guys can change course.\n\nThis helmet gives you great reflexes, which will help you dodge the attack of even your quickest enemies.'],

  ['head', 'helmet1', 'T1 Deathclaw', { hp_max: 20 }, 'You have been assured that these are bonefide chicken horns, sharp enough to pierce the strongest foe.'],
  ['torso', 'torso1', 'T1 Armor', { defense: 6 }],
  ['weapon', 'weapon1', 'T1 Weapon', { attack: 6, accuracy: 4 }],
  ['offhand', 'offhand1', 'T1 Offhand', { dodge: 4 }],

  ['head', 'helmet2', 'T2 Eye of the Chicken', { hp_max: 35 }],
  ['torso', 'torso2', 'T2 Armor', { defense: 12 }],
  ['weapon', 'weapon2', 'T2 Weapon A', { attack: 12, accuracy: 8 }],
  ['weapon', 'weapon2b', 'T2 Weapon B', { attack: 7, accuracy: 13 }],
  ['offhand', 'offhand2', 'T2 Offhand', { dodge: 8 }],

  ['head', 'helmet3', 'T3 Cockerel', { hp_max: 50 }],
  ['torso', 'torso3', 'T3 Armor', { defense: 18 }],
  ['weapon', 'weapon3', 'T3 Weapon', { attack: 20, accuracy: 12 }],
  ['offhand', 'offhand3', 'T3 Offhand A', { dodge: 12 }],
  ['offhand', 'offhand3b', 'T3 Offhand B', { dodge: 4, attack: 10 }],

  ['head', 'helmet4', 'T4 Chicken Wings', { hp_max: 65 }],
  ['torso', 'torso4', 'T4 Armor', { defense: 26 }],
  ['weapon', 'weapon4', 'T4 Weapon', { attack: 24, accuracy: 16 }],
  ['offhand', 'offhand4', 'T4 Offhand', { dodge: 16 }],

  ['consumable', 'med1', 'Med-Kit', { hp: 50 }],

  ['key', 'key1', 'The Dazzling Gift', undefined, 'Shiny.'],
  ['key', 'key2', 'The Golden Rocket', undefined, 'Shiny.'],
  ['key', 'key3', 'The Ticket to Paradise', undefined, 'Shiny.'],
  ['key', 'key4', 'The Safe Combination', undefined, '4, 8, 15, 16, 23, 42'],
  ['key', 'key5', 'The Ticket Outtahere', undefined, 'Poof.'],
];

export const ITEMS: Record<string, ItemDef> = (function () {
  let ret: Record<string, ItemDef> = {};
  for (let ii = 0; ii < ITEM_ROWS.length; ++ii) {
    let row = ITEM_ROWS[ii];
    ret[row[1]] = {
      item_type: row[0],
      name: row[2],
      stats: row[3] || {},
      desc: row[4] || '',
    };
  }
  return ret;
}());
