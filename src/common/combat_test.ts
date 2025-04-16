import fs from 'fs';
import { randSimpleSpatial } from 'glov/common/rand_fast';
import type { StatsData } from '../client/entity_demo_client';
import type { ItemType } from '../client/item_defs';

const { abs, pow, random, max, floor } = Math;

// return 0...1 weighted around 0.5
export function bellish(xin: number, exp: number): number {
  // also reasonable: return easeInOut(xin, 1/exp);
  xin = xin * 2 - 1; // -> -1..1
  let y = 1 - abs(pow(xin, exp)); // 0..1 weighted to 1
  // Earlier was missing the `1 - ` above and it weights heavily to the min/max,
  //   which is maybe interesting to try?  Will feel more like a "hit" and a
  //   "miss", with the same average, but more swingy.  Probably want to use
  //   another stat to influence, this, though, so it's not just 50% chance of a
  //   poor hit!
  if (xin < 0) {
    return y * 0.5;
  } else {
    return 1 - y * 0.5;
  }
}

function roundRand(v: number): number {
  return floor(v + random());
}

type DamageRet = {
  dam: number;
  style: 'miss' | 'normal' | 'crit';
};

export function damage(
  attacker: Omit<StatsData, 'hp' | 'hp_max' | 'tier'>,
  defender: Omit<StatsData, 'hp' | 'hp_max' | 'tier'>
): DamageRet {
  let attacker_atk = attacker.attack;
  let defender_def = defender.defense;
  let dam = attacker_atk * attacker_atk / (attacker_atk + defender_def);
  //dam *= lerp(bellish(random(), 3), 0.5, 1.5);

  let style: 'miss' | 'normal' | 'crit' = 'normal';
  let hit_chance = 2 - pow(0.5, attacker.accuracy/defender.dodge-1);
  if (hit_chance <= 1) {
    if (random() > hit_chance) {
      style = 'miss';
      dam *= 0.25;
    }
  } else if (random() < hit_chance - 1) {
    dam *= 2;
    style = 'crit';
  }

  dam = roundRand(dam);
  dam = max(1, dam);
  return {
    dam,
    style,
  };
}


type Stats = Omit<StatsData, 'hp_max' | 'tier'>;


let player_base: Stats = {
  // note: base stats *with* the T0 hat
  hp: 15,
  attack: 6,
  defense: 4,
  accuracy: 4,
  dodge: 4,
};

type Equip = Partial<Stats> & { slot: ItemType; tier: number };
let equipment: Equip[] = [{
  slot: 'head',
  tier: 0,
  hp: 5,
}, {
  // tier 1 found in zone 0, guarded by T0s
  // head - bought
  // torso - zone 0
  // weapon - zone 0
  // offhand - zone 0

  slot: 'head',
  tier: 1,
  hp: 20,
}, {
  slot: 'torso',
  tier: 1,
  defense: 6,
}, {
  slot: 'weapon',
  tier: 1,
  attack: 6,
  accuracy: 4,
}, {
  slot: 'offhand',
  tier: 1,
  dodge: 4,
}, {
  // tier 2 found in zone 1, guarded by T1s
  // head - bought
  // torso - zone 1
  // weapon - zone 1
  // offhand - zone 1
  // weaponb - zone 0 T1 blocked
  slot: 'head',
  tier: 2,
  hp: 35,
}, {
  slot: 'torso',
  tier: 2,
  defense: 12,
}, {
  slot: 'weapon',
  tier: 2,
  attack: 12,
  accuracy: 8,
}, {
  slot: 'offhand',
  tier: 2,
  dodge: 8,
}, {
  // tier 3 found in zone 2, guarded by T2s
  // head - bought
  // torso - zone 2
  // weapon - zone 2
  // offhand - zone 2
  // offhandb - zone 1 T2 blocked
  slot: 'head',
  tier: 3,
  hp: 50,
}, {
  slot: 'torso',
  tier: 3,
  defense: 18,
}, {
  slot: 'weapon',
  tier: 3,
  attack: 20,
  accuracy: 12,
}, {
  slot: 'offhand',
  tier: 3,
  dodge: 12,
}, {
  // tier 4 purchased or found in earlier zones - not required/expected
  // head - bought
  // torso - zone 0 T3 blocked
  // weapon - zone 1 T3 blocked
  // offhand - zone 2 T3 blocked
  slot: 'head',
  tier: 4,
  hp: 65,
}, {
  slot: 'torso',
  tier: 4,
  defense: 26,
}, {
  slot: 'weapon',
  tier: 4,
  attack: 24,
  accuracy: 16,
}, {
  slot: 'offhand',
  tier: 4,
  dodge: 16,
}];

let CONCISE = 'b' as 'a' | 'b' | false;
let TEST_TIERS = [0, 4];

const LABEL_TO_SPRITE = {
  normal: 'critter-11',
  sponge: 'critter-15',
  var: 'critter-14',
  cannon: 'critter-12',
  boss: 'critter-13',
};

let enemies: (Stats & { label: keyof typeof LABEL_TO_SPRITE })[][] = [
  // tier 0 - zone 0 enemies
  [{
    label: 'normal',
    hp: 12,
    attack: 5,
    defense: 3,
    accuracy: 4,
    dodge: 3,
  },{
    label: 'sponge',
    hp: 24, // sponge
    attack: 3,
    defense: 4,
    accuracy: 3,
    dodge: 1,
  },{
    label: 'var',
    hp: 10, // variable
    attack: 7,
    defense: 3,
    accuracy: 6,
    dodge: 2,
  }],
  // tier 1 - zone 1 enemies
  [{
    label: 'normal',
    hp: 18,
    attack: 9,
    defense: 8,
    accuracy: 7,
    dodge: 7,
  },{
    label: 'cannon',
    hp: 13, // glass cannon
    attack: 13,
    defense: 6,
    accuracy: 8,
    dodge: 7,
  },{
    label: 'var',
    hp: 16, // dodge tank
    attack: 8,
    defense: 7,
    accuracy: 5,
    dodge: 13,
  }],
  // tier 2 - zone 2 enemies
  [{
    label: 'normal',
    hp: 23,
    attack: 14,
    defense: 11,
    accuracy: 11,
    dodge: 11,
  }, {
    label: 'sponge',
    hp: 37, // sponge
    attack: 10,
    defense: 13,
    accuracy: 10,
    dodge: 10,
  }, {
    label: 'var',
    hp: 17, // glass cannon w/ dodge
    attack: 19,
    defense: 10,
    accuracy: 12,
    dodge: 14,
  }],
  // tier 3 - special bosses / blockers
  [{
    label: 'boss',
    hp: 70,
    attack: 19,
    defense: 18,
    accuracy: 15,
    dodge: 15,
  }],
  // tier 4 - final guard // ~90% death at double HP with T4 gear
  [{
    label: 'boss',
    hp: 115,
    attack: 36,
    defense: 43,
    accuracy: 20,
    dodge: 20,
  }],
];

const RUNS = 3000;
const NUM_PER_FLOOR = [
  10,
  10,
  10,
  3,
  1,
];

function rarr<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

let was_oneshot = false;
let fight_turns = 0;
function fight(player: Stats, player_hp: number, enemy: Stats): number {
  let turn = random() < 0.5;
  let enemy_hp = enemy.hp;
  was_oneshot = true;
  fight_turns = 0;
  while (player_hp > 0 && enemy_hp > 0) {
    let dam = damage(turn ? player : enemy, turn ? enemy: player).dam;
    if (turn) {
      enemy_hp -= dam;
      if (enemy_hp > 0) {
        was_oneshot = false;
      }
    } else {
      player_hp -= dam;
    }
    // console.log(dam, player_hp, enemy_hp);
    turn = !turn;
    ++fight_turns;
  }
  return Math.max(player_hp, 0);
}

function perc(v: number): string {
  return `%${(v * 100).toFixed(0)}`;
}
function avg(v: number, runs: number): string {
  return (v / runs).toFixed(1);
}

function equip(player: Stats, e: Equip): void {
  let key: keyof Stats;
  for (key in e as Stats) {
    player[key] += (e as Stats)[key];
  }
}

function unequip(player: Stats, slot: ItemType, tier: number): void {
  for (let ii = 0; ii < equipment.length; ++ii) {
    let e = equipment[ii];
    if (e.slot === slot && e.tier === tier) {
      let key: keyof Stats;
      for (key in e as Stats) {
        player[key] -= (e as Stats)[key];
      }
      return;
    }
  }
}

function runAgainst(prefix: string, player: Stats, tier: number, num_per_floor: number, upgrades: Equip[]): boolean {
  let deaths = 0;
  let total_heals = 0;
  let total_oneshots = 0;
  let total_turns = 0;
  let fights_til_death = 0;
  let enemy_list = [];
  for (let ii = 0; ii < 4; ++ii) {
    enemy_list.push(enemies[tier][0]);
  }
  if (enemies[tier][1]) {
    for (let ii = 0; ii < 3; ++ii) {
      enemy_list.push(enemies[tier][1]);
    }
  }
  if (enemies[tier][1]) {
    for (let ii = 0; ii < 3; ++ii) {
      enemy_list.push(enemies[tier][2]);
    }
  }
  let player_orig = player;
  for (let ii = 0; ii < RUNS; ++ii) {
    player = { ...player_orig };
    let hp = player.hp;
    let heals = 0;
    let oneshots = 0;
    let turns = 0;
    let died = false;

    rarr(upgrades);
    let upgrade_idx = 0;
    for (let jj = 0; jj < num_per_floor; ++jj) {
      if (upgrades.length && jj/(num_per_floor - 1) >= (upgrade_idx+1)/upgrades.length) {
        let e = upgrades[upgrade_idx++];
        unequip(player, e.slot, e.tier - 1);
        equip(player, e);
      }
      if (hp < player.hp * 0.5) {
        ++heals;
        hp = player.hp;
      }
      let enemy = enemy_list[jj];
      hp = fight(player, hp, enemy);
      // console.log('fight', enemy, hp);
      if (hp) {
        if (was_oneshot) {
          ++oneshots;
        }
        turns += fight_turns;
      } else {
        fights_til_death += jj;
        died = true;
        break;
      }
    }
    if (died) {
      ++deaths;
    } else {
      total_heals += heals;
      total_oneshots += oneshots;
      total_turns += turns;
    }
  }
  let runs = RUNS - deaths;
  if (!deaths && !total_heals && total_turns/num_per_floor/runs < 5) {
    console.log(`${prefix} TRIVIAL - Oneshots: ${perc(total_oneshots/num_per_floor/runs)}` +
      ` Turns/fight: ${avg(total_turns/num_per_floor, runs)}`);
    return false;
  }
  if (deaths/RUNS > 0.9) {
    console.log(`${prefix} DEATH - Death: ${perc(deaths/RUNS)}${deaths ?
      ` (survived ${avg(fights_til_death, deaths)})` : ''}`);
    return true;
  }
  console.log(`${prefix}`);
  console.log(`  Death: ${perc(deaths/RUNS)}${deaths ? ` (survived ${avg(fights_til_death, deaths)})` : ''}`);
  if (runs) {
    console.log([
      `  Heals: ${avg(total_heals, runs)}`,
      `Oneshots: ${perc(total_oneshots/num_per_floor/runs)}`,
      `Turns/fight: ${avg(total_turns/num_per_floor, runs)}`,
    ].join('  '));
  }
  return deaths === RUNS;
}

for (let player_tier = 0; player_tier <= 4; ++player_tier) {
  console.log('');
  let player = {
    ...player_base,
  };
  let upgrades: Equip[] = [];
  for (let ii = 0; ii < equipment.length; ++ii) {
    let e = equipment[ii];
    if (e.tier === player_tier) {
      equip(player, e);
    } else if (e.tier === player_tier + 1) {
      upgrades.push(e);
    }
  }
  for (let enemy_tier = TEST_TIERS[0]; enemy_tier <= TEST_TIERS[1]; ++enemy_tier) {
    if (CONCISE === 'a' && enemy_tier !== player_tier) {
      continue;
    }
    if (CONCISE === 'b' && enemy_tier !== player_tier && enemy_tier !== player_tier + 1) {
      continue;
    }
    let dobreak = runAgainst(`Player T${player_tier} vs Enemy T${enemy_tier}:`,
      player, enemy_tier, NUM_PER_FLOOR[enemy_tier], enemy_tier === player_tier ? upgrades : []);
    if (player_tier === 4 && enemy_tier === 4) {
      player.hp *= 2;
      runAgainst(`Player T${player_tier} (double HP) vs Enemy T${enemy_tier}:`,
        player, enemy_tier, NUM_PER_FLOOR[enemy_tier], upgrades);
      player.hp *= 2;
      runAgainst(`Player T${player_tier} (quadruple HP) vs Enemy T${enemy_tier}:`,
        player, enemy_tier, NUM_PER_FLOOR[enemy_tier], upgrades);
    }
    if (dobreak) {
      break;
    }
  }
}


const WRITE_ENEMIES = false;
if (WRITE_ENEMIES) {
  for (let enemy_tier = 0; enemy_tier < enemies.length; ++enemy_tier) {
    let enemy_list = enemies[enemy_tier];
    for (let jj = 0; jj < enemy_list.length; ++jj) {
      let e = enemy_list[jj];
      let suffix = enemy_list.length > 1 ? ['A','B','C'][jj] : '';
      let filename = `src/client/entities/enemyT${enemy_tier}${suffix}.entdef`;
      let tile = LABEL_TO_SPRITE[e.label];
      let period = 5000 + Math.round(randSimpleSpatial(1234, enemy_tier, jj, 0) * 5000);
      let data = `---
properties:${suffix === 'B' || suffix === 'C' ? '\n  respawns: true' : ''}
traits:
- id: enemy
- id: stats_default
  # NOTE: don't change these stats, change combat_test.ts
  hp: ${e.hp} # ${e.label}
  attack: ${e.attack}
  defense: ${e.defense}
  accuracy: ${e.defense}
  dodge: ${e.dodge}
  tier: ${enemy_tier}
- id: drawable
- id: drawable_sprite
  anim_data:
    idle:
      frames: [${tile}]
      times: 10000
  sprite_data:
    atlas: critters
    filter_min: LINEAR_MIPMAP_LINEAR
    filter_mag: LINEAR
    origin: [0.5, 1]
  scale: 0.85
  simple_anim:
    - period: ${period}
      scale: [1, 0.88]
`;
      console.log(filename);
      fs.writeFileSync(filename, data);
    }
  }
}
