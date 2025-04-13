import { Font } from 'glov/client/font';
import { mouseOver } from 'glov/client/input';
import {
  BLEND_MULTIPLY,
  Sprite,
  spriteClipPop,
  spriteClipPush,
  spriteCreate,
} from 'glov/client/sprites';
import { uiGetFont } from 'glov/client/ui';
import { easeOut, lerp } from 'glov/common/util';
import { crawlerRenderViewportGet } from './crawler_render';
import { EntityDrawableSprite } from './crawler_render_entities';
import {
  EntityDemoClient,
  StatsData,
} from './entity_demo_client';
import { game_height, game_width } from './globals';
import { drawHealthBar, myEnt } from './play';

const { abs, pow, random, max, floor, PI } = Math;

type Entity = EntityDemoClient;

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

//////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let font: Font;
let battle_frame: Sprite;
let battle_frame_hero_bg: Sprite;
let battle_frame_enemy_bg: Sprite;

type CombatState = {
  target: Entity;
  state: string;
  t: number;
};
let combat_state: CombatState | null = null;

export function cleanupCombat(dt: number): void {
  if (combat_state) {
    combat_state = null;
  }
}

const FRAME_HERO_X = 18;
const FRAME_ENEMY_X = 149;
const FRAME_Y = 44;
const FRAME_W = 175;
const FRAME_H = 171;
const HEALTH_HERO_X = 16;
const HEALTH_HERO_Y = 40;
const HEALTH_ENEMY_X = 240;
const HEALTH_ENEMY_Y = 202;
const HEALTH_W = 86;
const HEALTH_H = 17;
const ENT_SCALE = 1.25;
const FRAME_SLOPE = 171/51;

function drawCombatant(dt: number, ent_in: Entity, x: number, y: number): void {
  let ent = ent_in as unknown as EntityDrawableSprite;
  let frame = ent.updateAnim(dt);
  let { sprite } = ent.drawable_sprite_state;
  let aspect = sprite.uidata && sprite.uidata.aspect ? sprite.uidata.aspect[frame] : 1;
  let w = FRAME_W * ENT_SCALE;
  let h = FRAME_H * ENT_SCALE;
  if (aspect < 1) {
    w = h * aspect;
  } else {
    h = abs(w / aspect);
  }
  sprite.draw({
    w, h,
    x: x + FRAME_W * 0.5,
    y: y + FRAME_H + FRAME_H * (ENT_SCALE - 1)/2,
    z: Z.COMBAT + 1,
    frame,
  });
}

function drawHP(ent: Entity, x: number, y: number): void {
  let stats = ent.data.stats;
  let { hp, hp_max } = stats;
  let show_text = false;
  if (mouseOver({
    x, y,
    w: HEALTH_W, h: HEALTH_H,
  })) {
    show_text = true;
  }
  drawHealthBar(x, y, Z.UI, HEALTH_W, HEALTH_H, hp, hp_max, show_text);
}

export function doCombat(target: Entity, dt: number, paused: boolean): void {
  let me = myEnt();
  if (!combat_state) {
    combat_state = {
      target,
      state: 'fadein',
      t: 0,
    };
  }
  combat_state.t += dt;
  let { state, t } = combat_state;
  let dxh = 0;
  let dyh = 0;
  let dxe = 0;
  let dye = 0;
  if (state === 'fadein') {
    let p = t / 500;
    // p = mousePos()[0] / game_width;
    if (p >= 1) {
      combat_state.state = 'fight';
      combat_state.t = 0;
    } else {
      p = easeOut(p, 2);
      dxh = lerp(p, -FRAME_W, 0);
      dyh = lerp(p, FRAME_W * FRAME_SLOPE, 0);
      dxe = lerp(p, FRAME_W, 0);
      dye = lerp(p, -FRAME_W * FRAME_SLOPE, 0);
    }
  }
  let z = Z.COMBAT;
  let viewport = crawlerRenderViewportGet();
  spriteClipPush(z, viewport.x, viewport.y, viewport.w, viewport.h);
  battle_frame_hero_bg.draw({
    x: FRAME_HERO_X + dxh,
    y: FRAME_Y + dyh,
    w: FRAME_W,
    h: FRAME_H,
    z: z,
    blend: BLEND_MULTIPLY,
  });
  battle_frame_enemy_bg.draw({
    x: FRAME_ENEMY_X + dxe,
    y: FRAME_Y + dye,
    w: FRAME_W,
    h: FRAME_H,
    z: z,
    blend: BLEND_MULTIPLY,
  });
  spriteClipPop();

  if (FRAME_Y + 3 + dyh < game_height) {
    spriteClipPush(z + 0.2, 0, FRAME_Y + 3 + dyh, game_width, FRAME_H - 6);
    drawCombatant(dt, me, FRAME_HERO_X - 15, FRAME_Y);
    spriteClipPop();
  }
  if (abs(dye) < game_height) {
    spriteClipPush(z + 0.2, 0, FRAME_Y + 3 + dye, game_width, FRAME_H - 6);
    drawCombatant(dt, target, FRAME_ENEMY_X + 10, FRAME_Y);
    spriteClipPop();
  }

  spriteClipPush(z + 0.5, viewport.x, viewport.y, viewport.w, viewport.h);
  battle_frame.draw({
    x: FRAME_HERO_X + dxh,
    y: FRAME_Y + dyh,
    w: FRAME_W,
    h: FRAME_H,
    z: z + 0.5,
  });
  battle_frame.draw({
    x: FRAME_ENEMY_X + FRAME_W + dxe,
    y: FRAME_Y + FRAME_H - 1 + dye,
    w: FRAME_W,
    h: FRAME_H,
    z: z + 0.5,
    rot: PI,
  });
  drawHP(me, HEALTH_HERO_X + dxh, HEALTH_HERO_Y + dyh);
  drawHP(target, HEALTH_ENEMY_X + dxe, HEALTH_ENEMY_Y + dye);
  spriteClipPop();

}

export function combatStartup(): void {
  font = uiGetFont();
  battle_frame = spriteCreate({
    name: 'ui/battle-frame',
  });
  battle_frame_hero_bg = spriteCreate({
    name: 'ui/battle-frame-hero-bg',
  });
  battle_frame_enemy_bg = spriteCreate({
    name: 'ui/battle-frame-enemy-bg',
  });
}
