// import { lerp } from 'glov/common/util';

import { StatsData } from './entity_demo_client';

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

export function damage(attacker: StatsData, defender: StatsData): {
  dam: number;
  style: 'miss' | 'normal' | 'crit';
} {
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
