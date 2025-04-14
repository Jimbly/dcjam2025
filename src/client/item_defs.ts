import { StatsData } from './entity_demo_client';

export type ItemType = 'head' | 'torso' | 'weapon' | 'offhand' | 'consumable' | 'key';
export type ItemDef = {
  item_type: ItemType;
  name: string;
  stats: Partial<StatsData>;
};

type ItemRow = [ItemType, string, string, Partial<StatsData>?];
const ITEM_ROWS: ItemRow[] = [
  ['head', 'helmet1', 'Cocky Rooster', { defense: 1 }],
  ['head', 'helmet2', 'Deathclaw', { defense: 2 }],
  ['head', 'helmet3', 'Eye of the Chicken', { defense: 3 }],
  ['head', 'helmet4', 'Cockerel', { defense: 4 }],
  ['head', 'helmet5', 'Chicken Wings', { defense: 5 }],
  ['torso', 'torso1', 'Placeholder', { defense: 1 }],
  ['consumable', 'med1', 'Med-Kit', { hp: 50 }],
];

export const ITEMS: Record<string, ItemDef> = (function () {
  let ret: Record<string, ItemDef> = {};
  for (let ii = 0; ii < ITEM_ROWS.length; ++ii) {
    let row = ITEM_ROWS[ii];
    ret[row[1]] = {
      item_type: row[0],
      name: row[2],
      stats: row[3] || {},
    };
  }
  return ret;
}());
