/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from 'assert';
import { autoAtlas } from 'glov/client/autoatlas';
import { MODE_DEVELOPMENT } from 'glov/client/client_config';
import { getFrameDt, getFrameTimestamp } from 'glov/client/engine';
import { ALIGN, FontStyle, fontStyleColored } from 'glov/client/font';
import { keyDown, keyDownEdge, KEYS } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { spot, SPOT_DEFAULT_BUTTON } from 'glov/client/spot';
import {
  buttonText,
  drawLine,
  panel,
  playUISound,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight
} from 'glov/client/ui';
import { randCreate, shuffleArray } from 'glov/common/rand_alea';
import { clamp, easeIn, easeInOut, easeOut, lerp, map01, plural, ridx, sign } from 'glov/common/util';
import { JSVec2 } from 'glov/common/vmath';
import { DirType, EAST, NORTH, SOUTH, WEST } from '../common/crawler_state';
import { crawlerEntityManager, entityPosManager } from './crawler_entity_client';
import { crawlerController, crawlerGameState, crawlerScriptAPI } from './crawler_play';
import { dialog } from './dialog_system';
import { entityManager } from './entity_demo_client';
import {
  BUTTON_W,
  game_height,
  game_width,
  HUD_PAD,
  HUD_W,
  HUD_X0,
  HUD_Y0,
  MOVE_BUTTONS_X0,
  MOVE_BUTTONS_Y0,
  render_width,
  VIEWPORT_X0
} from './globals';
import { tickLoopingSound } from './music';
import { doMotionForTravelGame, drawHealthBar, drawHUDPanel, myEnt, queueTransition, useNoText } from './play';

const { abs, max, min, PI } = Math;

type Asteroid = {
  pos: JSVec2;
};

let rand = randCreate(Date.now());

let destination_floor = 10;
let destination_key = 'stairs_out';
export function travelTo(floor_id: number, special_pos: string): void {
  destination_floor = floor_id;
  destination_key = special_pos;
  crawlerController().goToFloor(7);
}

const LOOP_DIST = 50;

class TravelGameState {
  pos: JSVec2 = [0, 1];
  speed = 0;
  asteroids: Asteroid[];
  done = false;
  won = false;
  done_time = 0;
  crashed = false;
  transitioning = false;
  escape = 0.5;
  intro = 0;
  hblends: { t: number; d: number }[] = [];
  last_shift = 0;
  constructor() {
    let entity_manager = crawlerEntityManager();
    let game_state = crawlerGameState();
    let { floor_id } = game_state;
    let { entities } = entity_manager;
    for (let entity_id in entities) {
      let ent = entities[entity_id]!;
      if (ent.data.floor === floor_id &&
        (ent.type_id === 'asteroid_danger' || ent.type_id === 'asteroid')
      ) {
        entity_manager.deleteEntity(ent.id, 'reset');
      }
    }

    this.asteroids = [];
    let { asteroids } = this;
    let adist = 5;
    while (adist < LOOP_DIST * 2) {
      let asteroid: Asteroid = {
        pos: [adist, rand.range(3)],
      };
      if (adist < 15 && asteroid.pos[1] === 1) {
        asteroid.pos[1] += -1 + rand.range(2) * 2;
      }
      asteroids.push(asteroid);
      entity_manager.addEntityFromSerialized({
        type: 'asteroid_danger',
        floor: floor_id,
        pos: [adist, 2 + asteroid.pos[1], 0],
      });
      adist += 1 + rand.range(5);
    }

    // visuals
    [0, 1, 5, 6].forEach((lane) => {
      adist = 1;
      while (adist < LOOP_DIST * 2) {
        adist += 2 + rand.range(3);
        entity_manager.addEntityFromSerialized({
          type: 'asteroid',
          floor: floor_id,
          pos: [adist, lane, 0],
        });
      }
    });
  }
}

let travel_state: TravelGameState | null = null;

export function travelGameActive(): boolean {
  return Boolean(travel_state);
}

export function travelGameCheck(force_no: boolean): boolean {
  let game_state = crawlerGameState();
  let { floor_id } = game_state;
  if (floor_id !== 7 || force_no) {
    travel_state = null;
    tickLoopingSound(null);
    return false;
  }
  if (travel_state && travel_state.transitioning || crawlerController().transitioning_floor) {
    tickLoopingSound(null);
    return false;
  }
  if (!travel_state) {
    travel_state = new TravelGameState();
    crawlerController().setControllerType('instant');
  }
  tickLoopingSound(`ship/engine_${max(1, travel_state.speed)}`);
  return true;
}

let style = fontStyleColored(null, 0x000000ff);
let style_unimportant = fontStyleColored(null, 0x808080ff);
let style_danger = fontStyleColored(null, 0xFF4040ff);

export function travelGameFinish(): void {
  assert(travel_state);
  travel_state.transitioning = true;
  crawlerController().setControllerType('queued2');
  crawlerController().goToFloor(destination_floor, destination_key);
  queueTransition();
}

export function travelGameStartMove(dir: DirType): void {
  assert(travel_state);
  let now = getFrameTimestamp();
  let can_shift = now - travel_state.last_shift > 300;
  if (dir === NORTH) {
    if (travel_state.pos[1] < 2) {
      travel_state.pos[1]++;
      travel_state.hblends.push({
        t: 0,
        d: -1,
      });
    } else {
      playUISound('ship_cannot_move');
    }
  } else if (dir === SOUTH) {
    if (travel_state.pos[1] > 0) {
      travel_state.pos[1]--;
      travel_state.hblends.push({
        t: 0,
        d: 1,
      });
    } else {
      playUISound('ship_cannot_move');
    }
  } else if (dir === EAST) {
    if (travel_state.speed < 5 && can_shift) {
      travel_state.speed++;
      travel_state.last_shift = now;
      playUISound(`ship_accelerate_${max(2, travel_state.speed)}`);
    } else {
      playUISound('ship_cannot_move');
    }
  } else if (dir === WEST) {
    if (travel_state.speed > 0 && can_shift) {
      travel_state.speed--;
      travel_state.last_shift = now;
      playUISound(`ship_decelerate_${travel_state.speed}`);
    } else {
      playUISound('ship_cannot_move');
    }
  }
}

export function travelGameStartTurn(rot: DirType): void {
  if (rot === 1) {
    travelGameStartMove(NORTH);
  } else {
    travelGameStartMove(SOUTH);
  }
}

function shift(): void {
  assert(travel_state);
  travel_state.pos[0] -= LOOP_DIST;
  let entity_manager = crawlerEntityManager();
  let entity_pos_manager = entityPosManager();
  let game_state = crawlerGameState();
  let { floor_id } = game_state;
  let { entities } = entity_manager;
  for (let entity_id in entities) {
    let ent = entities[entity_id]!;
    if (ent.data.floor === floor_id &&
      (ent.type_id === 'asteroid_danger' || ent.type_id === 'asteroid')
    ) {
      ent.data.pos[0] -= LOOP_DIST;
      if (ent.data.pos[0] < 0) {
        ent.data.pos[0] += LOOP_DIST * 2;
      }
      entity_pos_manager.otherEntitySnapPos(Number(entity_id));
    }
  }
  let { asteroids } = travel_state;
  for (let ii = 0; ii < asteroids.length; ++ii) {
    let ast = asteroids[ii];
    ast.pos[0] -= LOOP_DIST;
    if (ast.pos[0] < 0) {
      ast.pos[0] += LOOP_DIST * 2;
    }
  }
}

let crash_x = 0;
export function doTravelGame(): void {
  assert(travel_state);
  let { asteroids, done, pos } = travel_state;
  const font = uiGetFont();
  let game_state = crawlerGameState();
  let z = Z.UI;

  let dt = getFrameDt();

  travel_state.intro += dt * 0.0005;

  if (!travel_state.done) {
    doMotionForTravelGame(dt);
  }
  if (!travel_state.done) {
    if (travel_state.escape >= 1) {
      travel_state.done = true;
      travel_state.done_time = 0;
      travel_state.won = true;
    } else if (travel_state.crashed) {
      travel_state.done = true;
      travel_state.done_time = 0;
      crash_x = pos[0];
      travel_state.won = false;
    }
    if (MODE_DEVELOPMENT && keyDownEdge(KEYS.F)) {
      travel_state.done = true;
      travel_state.done_time = 0;
      crash_x = pos[0];
      travel_state.won = keyDown(KEYS.SHIFT);
    }
    if (travel_state.done) {
      if (travel_state.won) {
        playUISound('ship_finish_success');
        travelGameFinish();
      } else {
        playUISound('ship_finish_failure');
        dialog('travelfail');
      }
    }
  }

  let lost = travel_state.done && !travel_state.won;
  if (lost) {
    travel_state.done_time = min(travel_state.done_time + dt * 0.001, 1);
    pos[0] = crash_x - easeOut(travel_state.done_time, 2) * 0.85;
  } else {
    if (travel_state.speed > 0) {
      let xpos0 = pos[0];
      let xpos1 = xpos0 + dt * (3 + travel_state.speed * 2) * 0.0008;
      travel_state.escape += dt * (travel_state.speed - 2.5) * 0.00005;
      travel_state.escape = clamp(travel_state.escape, 0, 1);

      let crashed = false;
      for (let ii = 0; ii < asteroids.length; ++ii) {
        let ast = asteroids[ii];
        let astx = ast.pos[0] + 0.32; // 0.4 is visually tightest, but there's hblends...
        if (ast.pos[1] === pos[1] &&
          xpos0 < astx && xpos1 >= astx
        ) {
          playUISound('ship_crash');
          crashed = true;
        }
      }

      if (crashed) {
        travel_state.crashed = true;
      } else {
        pos[0] = xpos1;
      }
    }
  }

  let BAR_PAD = 40;
  let BAR_Y = 40;
  let BAR_H = 24;
  let bar = {
    x: VIEWPORT_X0 + BAR_PAD,
    y: BAR_Y,
    z: Z.UI,
    w: render_width - BAR_PAD * 2,
    h: BAR_H,
  };
  drawHealthBar(bar.x, bar.y, bar.z, bar.w, bar.h, travel_state.escape, 1, false);
  if (!lost) {
    if (travel_state.escape < 0.05 && travel_state.speed < 3) {
      font.draw({
        color: 0x000000ff,
        ...bar,
        z: bar.z + 1,
        align: ALIGN.HVCENTER,
        text: 'ACCELERATE TO ESCAPE!',
      });
    } else if (travel_state.intro > 2 && !travel_state.speed) {
      font.draw({
        color: 0x000000ff,
        ...bar,
        x: bar.x + bar.w/2,
        w: bar.w/2,
        z: bar.z + 1,
        align: ALIGN.HVCENTER,
        text: 'ACCELERATE TO ESCAPE!',
      });
    }
    let escape_size = uiTextHeight() * 2;
    let text_y = bar.y - escape_size - 2.2;
    let api = crawlerScriptAPI();
    if (travel_state.intro < 1) {
      function msg(text: string, offs: number): void {
        let text_w = font.draw({
          color: 0x000000ff,
          size: escape_size,
          x: bar.x + bar.w/2 + offs,
          y: text_y,
          z: bar.z + 4,
          align: ALIGN.HCENTER,
          text,
        });
        let panel_w = text_w + 20;
        panel({
          x: bar.x + (bar.w - panel_w) / 2 + offs,
          y: text_y - 6,
          z: bar.z + 3,
          w: panel_w,
          h: escape_size + 6 * 2,
          eat_clicks: false,
        });
      }
      const E = 0.1;
      if (travel_state.intro < 0.5 + E/2) {
        let offs = travel_state.intro < E ? lerp(map01(travel_state.intro, 0, E), -1, 0) :
          travel_state.intro > 0.5 - E/2 ? lerp(map01(travel_state.intro, 0.5 - E/2, 0.5 + E/2), 0, 1) : 0;
        offs = easeIn(abs(offs), 4) * sign(offs) * 600;

        msg(api.keyGet('sawpirates') ? 'PIRATES (AGAIN)!' : 'PIRATES!', offs);
      }
      if (travel_state.intro > 0.5 - E/2) {
        let offs = travel_state.intro < 0.5 + E/2 ? lerp(map01(travel_state.intro, 0.5 - E/2, 0.5 + E/2), -1, 0) :
          travel_state.intro > 1 - E ? lerp(map01(travel_state.intro, 1 - E, 1), 0, 1) : 0;
        offs = easeIn(abs(offs), 4) * sign(offs) * 600;

        msg('ESCAPE!', offs);
      }
    } else {
      if (!api.keyGet('sawpirates')) {
        api.keySet('sawpirates');
      }
    }
  }

  if (pos[0] > LOOP_DIST) {
    shift();
  }

  game_state.angle = 0;
  let ypos = pos[1];
  for (let ii = travel_state.hblends.length - 1; ii >= 0; --ii) {
    let elem = travel_state.hblends[ii];
    elem.t += dt * 0.004;
    if (elem.t >= 1) {
      ridx(travel_state.hblends, ii);
      continue;
    }
    ypos += lerp(easeOut(elem.t, 2), elem.d, 0);
  }
  game_state.pos[0] = pos[0];
  game_state.pos[1] = 2 + ypos;

  drawHUDPanel();
}
