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
  // ['head', 'helmet2', 'Eye of the Chicken', { defense: 3, attack: 1 }],
  // ['head', 'helmet3', 'Cockerel', { defense: 4 }],
  // ['head', 'helmet4', 'Chicken Wings', { defense: 5 }],
  ['torso', 'torso1', 'T1 Armor', { defense: 6 }],
  ['weapon', 'weapon1', 'T1 Weapon', { attack: 6, accuracy: 4 }],
  ['offhand', 'offhand1', 'T1 Offhand', { dodge: 4 }],
  ['consumable', 'med1', 'Med-Kit', { hp: 50 }],

  ['key', 'key1', 'The Dazzling Gift', undefined, 'Shiny.'],
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
