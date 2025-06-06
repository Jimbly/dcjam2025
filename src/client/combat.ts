import assert from 'assert';
import { autoAtlas } from 'glov/client/autoatlas';
import { debugDefineIsSet, getFrameTimestamp } from 'glov/client/engine';
import { ALIGN, Font, fontStyle } from 'glov/client/font';
import { KEYS, mouseOver, PAD, padButtonDownEdge } from 'glov/client/input';
import {
  BLEND_ADDITIVE,
  BLEND_MULTIPLY,
  Sprite,
  spriteClipPop,
  spriteClipPush,
  spriteCreate,
} from 'glov/client/sprites';
import { buttonText, playUISound, uiButtonWidth, uiGetFont } from 'glov/client/ui';
import { mashString, randCreate } from 'glov/common/rand_alea';
import type { VoidFunc } from 'glov/common/types';
import { easeOut, lerp, ridx } from 'glov/common/util';
import { vec2 } from 'glov/common/vmath';
import { crawlerGameState } from './crawler_play';
import { crawlerRenderViewportGet } from './crawler_render';
import { EntityDrawableSprite } from './crawler_render_entities';
import { numMedkits } from './dialog_data';
import { dialog } from './dialog_system';
import {
  EntityDemoClient,
  entityManager,
  StatsData,
} from './entity_demo_client';
import { game_height, game_width } from './globals';
import { drawHealthBar, giveReward, helmetTier, myEnt, useMedkit } from './play';

const { abs, pow, max, min, floor, round, PI } = Math;

type Entity = EntityDemoClient;

const REWARD_TIERS = [
  40,
  75,
  100,
  350,
  5000,
];

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

let rand = randCreate();

function combatSetSeed(seed: number): void {
  rand.reseed(seed);
}

function roundRand(v: number): number {
  return floor(v + rand.random());
}

type DamageRet = {
  dam: number;
  style: 'miss' | 'normal' | 'crit';
};

export function damage(
  attacker: Omit<StatsData, 'hp' | 'hp_max'>,
  defender: Omit<StatsData, 'hp' | 'hp_max'>,
  average?: boolean,
  average_roll?: number,
): DamageRet {
  let attacker_atk = attacker.attack;
  let defender_def = defender.defense;
  let dam = attacker_atk * attacker_atk / (attacker_atk + defender_def);
  //dam *= lerp(bellish(random(), 3), 0.5, 1.5);

  let style: 'miss' | 'normal' | 'crit' = 'normal';
  let hit_chance = 2 - pow(0.5, attacker.accuracy/defender.dodge-1);
  let r = average ? average_roll! : rand.random();
  if (hit_chance <= 1) {
    if (r > hit_chance) {
      style = 'miss';
      dam *= 0.25;
    }
  } else if (r < hit_chance - 1) {
    dam *= 2;
    style = 'crit';
  }

  if (average) {
    dam = round(dam);
  } else {
    dam = roundRand(dam);
  }
  dam = max(1, dam);
  return {
    dam,
    style,
  };
}

export function isDeadly(player: StatsData, enemy: StatsData): boolean {
  let enemy_damage = 0;
  let player_damage = 0;
  for (let ii = 0; ii < 8; ++ii) {
    let r = 0.125 * (ii + 0.5);
    enemy_damage += damage(enemy, player, true, r).dam;
    player_damage += damage(player, enemy, true, r).dam;
  }
  let turns_to_kill_enemy = round(enemy.hp / (player_damage / 8));
  let total_damage = (turns_to_kill_enemy + 1) * (enemy_damage / 8);
  return total_damage > player.hp_max;
}

//////////////////////////////////////////////////////////////////////////

let font: Font;
let battle_frame: Sprite;
let battle_frame_hero_bg_top: Sprite;
let battle_frame_hero_bg_bot: Sprite;
let battle_frame_enemy_bg_top: Sprite;
let battle_frame_enemy_bg_bot: Sprite;
let sprite_pow: {
  normal: Sprite;
  miss: Sprite;
  crit: Sprite;
};
let style_pow_base = {
  outline_width: 0.8,
  outline_color: 0xFFFFFFff,
  glow_color: 0x404040bb,
  glow_inner: 1.5,
  glow_outer: 1.9,
};
let style_pow = {
  normal: fontStyle(null, {
    ...style_pow_base,
    color: 0xff9900ff,
  }),
  miss: fontStyle(null, {
    ...style_pow_base,
    color: 0xbcaabcff,
  }),
  crit: fontStyle(null, {
    ...style_pow_base,
    color: 0xce0d00ff,
  }),
};

type CombatFloater = {
  state: string;
  dam: DamageRet;
  t: number;
};

type CombatState = {
  target: Entity;
  target_hp: number;
  state: string;
  t: number;
  dam?: DamageRet;
  did_sound: number;
  did_event: number;
  floaters: CombatFloater[];
};
let combat_state: CombatState | null = null;

function floaterPush(dam: DamageRet): void {
  combat_state!.floaters.push({
    state: combat_state!.state,
    dam,
    t: 0,
  });
}

function startState(state: string): void {
  let me = myEnt();
  assert(combat_state);
  combat_state.state = state;
  combat_state.t = 0;
  combat_state.did_sound = 0;
  combat_state.did_event = 0;
  switch (state) {
    case 'hero':
      combat_state.dam = damage(me.data.stats, combat_state.target.data.stats);
      break;
    case 'enemy':
      combat_state.dam = damage(combat_state.target.data.stats, me.data.stats);
      break;
    case 'fadeout':
      // nothing special
      if (me.data.stats.hp) {
        let tier = combat_state.target.data.stats.tier || 0;
        if (combat_state.target.theguard) {
          dialog('killedguard');
        } else {
          giveReward({
            money: REWARD_TIERS[tier],
          });
        }
      }
      break;
    default:
      assert(false);
  }
}


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
const ENT_SCALE_HERO = 1.25;
const ENT_SCALE_ENEMY = 1;
const FRAME_SLOPE = 171/51;
const HERO_AVATAR_X = -15;
const ENEMY_AVATAR_X = 10;
const FLOATER_W = 120;
const FLOATER_FONT_SIZE = 32;
const bottom_center = vec2(0.5, 1);
function drawCombatant(dt: number, ent_in: Entity, x: number, y: number, scale: number, dead: boolean): void {
  let ent = ent_in as unknown as EntityDrawableSprite;
  let frame = ent.updateAnim(dt);
  let { sprite } = ent.drawable_sprite_state;
  let ent_scale = ENT_SCALE_ENEMY;
  if (ent_in === myEnt()) {
    ent_scale = ENT_SCALE_HERO;
    sprite = autoAtlas('hero', helmetTier()).withOrigin(bottom_center);
    frame = 0;
  }
  let sprite_scale = ent.drawable_sprite_opts.combat_scale || ent.drawable_sprite_opts.scale;
  let combat_offs = ent.drawable_sprite_opts.combat_offs || 0;
  ent_scale *= sprite_scale;
  let aspect = sprite.uidata && sprite.uidata.aspect ? sprite.uidata.aspect[frame] : 1;
  let w = FRAME_W * ent_scale*scale;
  let h = FRAME_H * ent_scale*scale;
  if (aspect < 1) {
    w = h * aspect;
  } else {
    h = abs(w / aspect);
  }
  sprite.draw({
    color: dead ? [0,0,0,1] : undefined,
    w, h,
    x: x + FRAME_W * 0.5,
    y: y + FRAME_H + FRAME_H * (scale - 1)*0.4 + FRAME_H * 0.1 * ent_scale - combat_offs * FRAME_H,
    z: Z.COMBAT + 1,
    frame,
  });
}

function drawHP(hp: number, ent: Entity, x: number, y: number): void {
  let stats = ent.data.stats;
  let { hp_max } = stats;
  let show_text = false;
  if (ent === myEnt()) {
    font.draw({
      size: 20,
      x, y,
      w: HEALTH_W,
      align: ALIGN.VBOTTOM|ALIGN.HCENTER,
      style: hp < hp_max * 0.33 ? style_pow.crit : style_pow.normal,
      text: `${hp}/${hp_max}`,
    });
  } else {
    if (mouseOver({
      x, y,
      w: HEALTH_W, h: HEALTH_H,
    })) {
      show_text = true;
    }
  }
  drawHealthBar(x, y, Z.UI, HEALTH_W, HEALTH_H, hp, hp_max, show_text);
}

function soundIndex(time_req: number, sound_index: number, sound_id: string): void {
  if (combat_state!.t < time_req) {
    return;
  }
  if (combat_state!.did_sound >= sound_index) {
    return;
  }
  combat_state!.did_sound = sound_index;
  playUISound(sound_id);
}

function eventIndex(time_req: number, event_idx: number, f: VoidFunc): void {
  if (combat_state!.t < time_req) {
    return;
  }
  if (combat_state!.did_event >= event_idx) {
    return;
  }
  combat_state!.did_event = event_idx;
  f();
}

function numLivingEnemies(): number {
  let { floor_id } = crawlerGameState();
  let { entities } = entityManager();
  let ret = 0;
  for (let key in entities) {
    let ent = entities[key]!;
    if (ent.isEnemy() && ent.data.floor === floor_id) {
      ++ret;
    }
  }
  return ret;
}

export function combatActive(): boolean {
  return Boolean(combat_state);
}

export function doCombat(target: Entity, dt: number, paused: boolean): void {
  if (paused) {
    dt = 0;
  }
  let me = myEnt();
  if (!combat_state || combat_state.target.id !== target.id) {
    target.fade_out_at = getFrameTimestamp();
    combat_state = {
      target_hp: target.data.stats.hp,
      target,
      state: 'fadein',
      t: 0,
      did_sound: 0,
      did_event: 0,
      floaters: [],
    };
    combatSetSeed(mashString([target.data.floor, numLivingEnemies()].join()));
    playUISound('combat_start');
  }

  combat_state.t += dt;
  let { state, t } = combat_state;
  let dxh = 0;
  let dyh = 0;
  let dxe = 0;
  let dye = 0;
  let dxh_noframe = 0;
  let dxe_noframe = 0;
  let viewport = crawlerRenderViewportGet();
  let enemytype = target.enemytype || 'alien';
  if (state === 'fadein' || state === 'fadeout') {
    let p = t / 500;
    // p = mousePos()[0] / game_width;
    if (p >= 1) {
      if (state === 'fadein') {
        startState(rand.random() < 0.5 ? 'hero' : 'enemy');
      } else {
        me.not_dead_yet = false;
        target.data.stats.hp = combat_state.target_hp;
        if (!target.data.stats.hp) {
          entityManager().deleteEntity(target.id, 'killed');
        }
        return;
      }
    } else {
      if (state === 'fadeout') {
        p = 1 - p;
      }
      p = easeOut(p, 2);
      dxh = lerp(p, -FRAME_W, 0);
      dyh = lerp(p, FRAME_W * FRAME_SLOPE, 0);
      dxe = lerp(p, FRAME_W, 0);
      dye = lerp(p, -FRAME_W * FRAME_SLOPE, 0);
    }
  } else {
    let button_w = uiButtonWidth();
    let disabled = !numMedkits() || me.data.stats.hp === me.data.stats.hp_max;
    if (target.data.stats.tier === 4 && me.isAlive() && buttonText({
      x: viewport.x + floor(viewport.w/2 - button_w/2),
      y: viewport.y + viewport.h * 0.9,
      w: button_w,
      disabled,
      text: 'USE MED-KIT',
      hotkeys: [KEYS.SPACE, KEYS.H],
      hotpad: PAD.SELECT,
    }) || !disabled && padButtonDownEdge(PAD.LEFT_TRIGGER)) {
      useMedkit();
    }
  }
  let pscale = 1;
  let escale = 1;
  if (state === 'hero' || state === 'enemy') {
    eventIndex(300, 1, function () {
      if (!debugDefineIsSet('INVINCIBLE')) {
        if (state === 'hero') {
          combat_state!.target_hp = max(0, combat_state!.target_hp - combat_state!.dam!.dam);
        } else {
          me.data.stats.hp = max(0, me.data.stats.hp - combat_state!.dam!.dam);
          if (!me.data.stats.hp) {
            me.not_dead_yet = true;
          }
        }
      }
      floaterPush(combat_state!.dam!);
    });
    if (state === 'hero') {
      soundIndex(200, 1, `combat_hero_hit_${combat_state.dam!.style}`);
      soundIndex(350, 2, `combat_${enemytype}_damaged_${combat_state.dam!.style}`);
      // soundIndex(350, 3, `combat_enemy_damaged_${combat_state.dam!.style}`);
    } else {
      soundIndex(200, 1, `combat_${enemytype}_hit_${combat_state.dam!.style}`);
      soundIndex(350, 2, `combat_hero_damaged_${combat_state.dam!.style}`);
    }
    function grow(other: boolean, amt: number): void {
      if (state === 'hero' === !other) {
        pscale *= 1 + amt * (other ? 0 : 0.5);
        dxh_noframe += amt * 30 * (other ? -0.5 : 1);
      } else {
        escale *= 1 + amt * (other ? 0 : 0.5);
        dxe_noframe -= amt * 30 * (other ? -0.5 : 1);
      }
    }
    if (t < 200) {
      grow(false, easeOut(t/200, 2));
    } else if (t < 400) {
      grow(false, 1 - easeOut(t/200 - 1, 2));
      grow(true, easeOut(t/200 - 1, 2));
    } else if (t < 600) {
      grow(true, 1 - easeOut(t/200 - 2, 2));
    } else if (t >= 600) {
      if (state === 'hero') {
        if (!combat_state.target_hp) {
          startState('fadeout');
          playUISound(`combat_${enemytype}_death`);
        } else {
          startState('enemy');
        }
      } else {
        if (!me.data.stats.hp) {
          startState('fadeout');
          playUISound('combat_hero_death');
        } else {
          startState('hero');
        }
      }
    }
  }
  let z = Z.COMBAT;
  spriteClipPush(z, viewport.x, viewport.y, viewport.w, viewport.h);
  battle_frame_hero_bg_bot.draw({
    x: FRAME_HERO_X + dxh,
    y: FRAME_Y + dyh,
    w: FRAME_W,
    h: FRAME_H,
    z: z,
    blend: BLEND_ADDITIVE,
  });
  battle_frame_hero_bg_top.draw({
    x: FRAME_HERO_X + dxh,
    y: FRAME_Y + dyh,
    w: FRAME_W,
    h: FRAME_H,
    z: z + 0.01,
    blend: BLEND_MULTIPLY,
  });
  battle_frame_enemy_bg_bot.draw({
    x: FRAME_ENEMY_X + dxe,
    y: FRAME_Y + dye,
    w: FRAME_W,
    h: FRAME_H,
    z: z,
    blend: BLEND_ADDITIVE,
  });
  battle_frame_enemy_bg_top.draw({
    x: FRAME_ENEMY_X + dxe,
    y: FRAME_Y + dye,
    w: FRAME_W,
    h: FRAME_H,
    z: z + 0.01,
    blend: BLEND_MULTIPLY,
  });
  spriteClipPop();

  if (FRAME_Y + 3 + dyh < game_height) {
    spriteClipPush(z + 0.2, FRAME_HERO_X, FRAME_Y + 3 + dyh, game_width - FRAME_HERO_X, FRAME_H - 6);
    drawCombatant(dt, me, FRAME_HERO_X + HERO_AVATAR_X + dxh_noframe, FRAME_Y, pscale,
      me.data.stats.hp === 0);
    spriteClipPop();
  }
  if (abs(dye) < game_height) {
    spriteClipPush(z + 0.2, 0, FRAME_Y + 3 + dye, game_width, FRAME_H - 6);
    drawCombatant(dt, target, FRAME_ENEMY_X + ENEMY_AVATAR_X + dxe_noframe, FRAME_Y, escale,
      combat_state.target_hp === 0);
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
  drawHP(me.data.stats.hp, me, HEALTH_HERO_X + dxh, HEALTH_HERO_Y + dyh);
  drawHP(combat_state.target_hp, target, HEALTH_ENEMY_X + dxe, HEALTH_ENEMY_Y + dye);
  spriteClipPop();

  for (let ii = combat_state.floaters.length - 1; ii >= 0; --ii) {
    let floater = combat_state.floaters[ii];
    floater.t += dt;
    let p = floater.t/500;
    if (p >= 1) {
      ridx(combat_state.floaters, ii);
      continue;
    }
    let float_box = {
      x: (floater.state === 'hero' ? FRAME_ENEMY_X + ENEMY_AVATAR_X : FRAME_HERO_X + HERO_AVATAR_X) + FRAME_W/2,
      y: FRAME_Y + FRAME_H * 0.45 - easeOut(p, 2) * 40,
      w: FLOATER_W, h: FLOATER_W,
    };
    let alpha = min(1, (1 - p) * 2);
    alpha = easeOut(alpha, 2);
    sprite_pow[floater.dam.style].draw({
      color: [1,1,1, alpha],
      ...float_box,
      z: z + 3,
    });
    font.draw({
      x: float_box.x,
      y: float_box.y + 40,
      size: FLOATER_FONT_SIZE,
      style: style_pow[floater.dam.style],
      alpha,
      z: z + 4,
      align: ALIGN.HVCENTER,
      text: `${floater.dam.dam}`,
    });
  }

}

const half_vec = vec2(0.5, 0.5);
export function combatStartup(): void {
  font = uiGetFont();
  battle_frame = spriteCreate({
    name: 'battle-frame',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  battle_frame_hero_bg_top = spriteCreate({
    name: 'battle-frame-hero-bg-top-mult',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  battle_frame_hero_bg_bot = spriteCreate({
    name: 'battle-frame-hero-bg-bottom-add',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  battle_frame_enemy_bg_top = spriteCreate({
    name: 'battle-frame-enemy-bg-top-mult',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  battle_frame_enemy_bg_bot = spriteCreate({
    name: 'battle-frame-enemy-bg-bottom-add',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  sprite_pow = {
    normal: spriteCreate({
      name: 'combat-hit-normal',
      origin: half_vec,
    }),
    miss: spriteCreate({
      name: 'combat-hit-miss',
      origin: half_vec,
    }),
    crit: spriteCreate({
      name: 'combat-hit-crit',
      origin: half_vec,
    }),
  };
}
