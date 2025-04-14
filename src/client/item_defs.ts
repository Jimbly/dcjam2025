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
  ['head', 'helmet1', 'Cocky Rooster', { defense: 1 }, 'Have you ever tried to catch a chicken?  Well, then you know how fast these little guys can change course.\n\nThis helmet gives you great reflexes, which will help you dodge the attack of even your quickest enemies.'],
  ['head', 'helmet2', 'Deathclaw', { defense: 2, attack: 1 }, 'You have been assured that these are bonefide chicken horns, sharp enough to pierce the strongest foe.'],
  ['head', 'helmet3', 'Eye of the Chicken', { defense: 3, attack: 1 }],
  ['head', 'helmet4', 'Cockerel', { defense: 4 }],
  ['head', 'helmet5', 'Chicken Wings', { defense: 5 }],
  ['torso', 'torso1', 'Placeholder Armor', { defense: 1 }],
  ['weapon', 'weapon1', 'Placeholder Weapon', { attack: 1 }],
  ['offhand', 'shield1', 'Placeholder Offhand', { dodge: 1 }],
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
