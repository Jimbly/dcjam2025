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
  ['head', 'helmetfree', 'Cockerel', { hp_max: 5 }, 'I guess this goes on my... head?  It\'s still slightly moist.  I guess, if it keeps me alive...'],

  ['weapon', 'weapon1', 'T1 Weapon', { attack: 4 }],
  ['offhand', 'offhand1', 'T1 Offhand', { dodge: 2, accuracy: 2 }],
  ['torso', 'torso1', 'T1 Armor', { defense: 6, dodge: 2, attack: 2 }],
  ['head', 'helmet1', 'Eye of the Chicken', { hp_max: 20, accuracy: 2 }, 'Helps you better see the thrill of the fight and stalk your prey in the night.'],

  ['offhand', 'offhand2', 'T2 Offhand', { accuracy: 5, defense: 1 }],
  ['torso', 'torso2', 'T2 Armor', { defense: 11 }],
  ['weapon', 'weapon2', 'T2 Weapon A', { attack: 10, accuracy: 3 }],
  ['weapon', 'weapon2b', 'T2 Weapon B', { attack: 7, accuracy: 8 }],
  ['head', 'helmet2', 'Chicken Wings', { hp_max: 35, dodge: 8 }, 'Have you ever tried to catch a chicken?  Well, then you know how fast these little guys can change course.\n\nThis helmet gives you great reflexes, which will help you dodge the attack of even your quickest enemies.'],

  ['offhand', 'offhand3', 'T3 Offhand A', { dodge: 8 }],
  ['weapon', 'weapon3', 'T3 Weapon', { attack: 20, accuracy: 8 }],
  ['torso', 'torso3', 'T3 Armor', { defense: 12, accuracy: 4 }],
  ['offhand', 'offhand3b', 'T3 Offhand B', { attack: 10 }],
  ['head', 'helmet3', 'Cocky Rooster', { hp_max: 50, defense: 6, dodge: 4 }, 'Wearing this you feel like you might be compensating for something.  Lack of colorful plumage, perhaps.'],

  ['torso', 'torso4', 'T4 Armor', { defense: 18 }],
  ['weapon', 'weapon4', 'T4 Weapon', { attack: 20, accuracy: 16 }],
  ['offhand', 'offhand4', 'T4 Offhand', { dodge: 16, defense: 8 }],
  ['head', 'helmet4', 'Deathclaw', { hp_max: 65, attack: 4 }, 'You have been assured that these are bonefide chicken horns, sharp enough to pierce the strongest foe.'],

  ['consumable', 'med1', 'Med-Kit', { hp: 50 }],

  ['key', 'key1', 'The Dazzling Gift', undefined, 'Shiny.'],
  ['key', 'key2', 'The Golden Rocket', undefined, 'Shiny.'],
  ['key', 'key3', 'The Ticket to Paradise', undefined, 'Shiny.'],
  ['key', 'key4', 'The Safe Combination', undefined, '4, 8, 15, 16, 23, 42'],
  ['key', 'key5', 'The Ticket Outtahere', undefined, 'Poof.'],
  ['key', 'key6', 'The Red Devastation', undefined, 'Probably goes boom.'],
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
