/* eslint-disable @stylistic/max-len */
/* eslint-disable @stylistic/quotes */
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

  ['weapon', 'weapon1', 'Tiny Knife', { attack: 4 }, "Bottom of the metaphorical barrel, but it's all I've got."],
  ['offhand', 'offhand1', 'Wooden Disc', { dodge: 2, accuracy: 2 }, "Bottom of the literal barrel, I guess it'll work for a shield..."],
  ['torso', 'torso1', 'Cardboard Armor', { defense: 6, dodge: 2, attack: 2 }, "It's a delivery box with holes cut in it.\n\nToo many holes though, maybe that last guy had\na few more arms than I do?"],
  ['head', 'helmet1', 'Eye of the Chicken', { hp_max: 20, accuracy: 2 }, 'Helps you better see the thrill of the fight and stalk your prey in the night.'],

  ['offhand', 'offhand2', 'Relaxing Incense', { accuracy: 5, defense: 1 }, "Helping to keep me calm and carry on hitting my marks.\n\nWhat exactly am I burning, though?"],
  ['torso', 'torso2', 'Body Chainmail ', { defense: 11 }, "Really just some chains to wrap around myself.\n\nAt least it's pretty easy to move around in."],
  ['weapon', 'weapon2', 'Sharp Stalactite', { attack: 10, accuracy: 3 }, "I can barely wield this thing, but as long as I hold it tight, it'll hit hard."],
  ['weapon', 'weapon2b', 'Ritual Knife', { attack: 7, accuracy: 8 }, "Lightweight, but sharp.\n\nThat's PROBABLY NOT human blood on it."],
  ['head', 'helmet2', 'Chicken Wings', { hp_max: 35, dodge: 8 }, 'Have you ever tried to catch a chicken?  Then you know how fast these little guys can dodge.\n\nThis helmet gives you equally great reflexes.'],

  ['offhand', 'offhand3', 'A Chicken', { dodge: 8 }, "Very loud and distracting.\n\nIs this where the food on the space stations comes from?\n\nAlso, it's a requirement."],
  ['weapon', 'weapon3', 'Talking Sword', { attack: 20, accuracy: 8 }, "It's currently giving me the silent treatment, but I swear it was talking to me.\n\nSaying something about destroying EVIL in my mind..."],
  ['torso', 'torso3', 'Iron Plate', { defense: 12, accuracy: 4 }, "Primarily for eating off of.\n\nTastes ironic."],
  ['offhand', 'offhand3b', "Rabbit's Foot", { attack: 10 }, "It's got huge, sharp...  It's got a vicious streak a mile wide.\n\nI feel daft waving this thing around."],
  ['head', 'helmet3', 'Cocky Rooster', { hp_max: 50, defense: 6, dodge: 4 }, 'Wearing this you feel like you might be compensating for something.\n\nLack of colorful plumage, perhaps.'],

  ['torso', 'torso4', 'Flak Armor', { defense: 18 }, "I've never felt so secure in my life.\n\nWell, at least not while\nalso in life-or-death\nbattle situations."],
  ['weapon', 'weapon4', 'Lazer Gun', { attack: 20, accuracy: 16 }, 'Disclaimer: contains no\nreal LASERs'],
  ['offhand', 'offhand4', 'Zoom Shield', { dodge: 16, defense: 8 }, "Whatever it is, it's making me feel like I can run forever!\n\nGives me a real case of the zoomies."],
  ['head', 'helmet4', 'Deathclaw', { hp_max: 65, attack: 4 }, 'You have been assured\nthat these are bonefide chicken horns, sharp enough to pierce the strongest foe.'],

  ['consumable', 'med1', 'Med-Kit', { hp: 50 }, 'This should get me healed up.\n\nPress H or LT to heal while exploring.\n\nWARNING: Known to the empire of Kali4nia to\ncause cancer.'],

  ['key', 'key1', 'The Dazzling Gift', undefined, 'Shiny.\n\nEven I would be tempted to get back with my last ex in exchange for this.'],
  ['key', 'key2', 'The Golden Rocket', undefined, "The B-23 '86 first place trophy.\n\nThere is no record of what happened to its rightful owner."],
  ['key', 'key3', 'The Ticket to Paradise', undefined, "I wish this were for me instead...\n\nJust imagine who I could be, with this..."],
  ['key', 'key4', 'The Safe Combination', undefined, '4, 8, 15, 16, 23, 42\n\nTHE ASSISTANT insists that, if asked, you claim you just found this on the ground, someone must have Lost it.'],
  ['key', 'key5', 'The Ticket Outtahere', undefined, "My lifeline after pulling this thing off."],
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
