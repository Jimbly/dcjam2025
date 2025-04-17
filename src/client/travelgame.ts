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
import { clamp, easeInOut, easeOut, lerp, plural, ridx } from 'glov/common/util';
import { JSVec2 } from 'glov/common/vmath';
import { DirType, EAST, NORTH, SOUTH, WEST } from '../common/crawler_state';
import { crawlerEntityManager } from './crawler_entity_client';
import { crawlerController, crawlerGameState } from './crawler_play';
import { dialog } from './dialog_system';
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

const { max, min, PI } = Math;

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

const TARGET_DIST = 77;

class TravelGameState {
  pos: JSVec2 = [0, 1];
  speed = 1;
  asteroids: Asteroid[];
  done = false;
  won = false;
  transitioning = false;
  hblends: { t: number; d: number }[] = [];
  last_shift = 0;
  constructor() {
    let entity_manager = crawlerEntityManager();
    let game_state = crawlerGameState();
    let { floor_id } = game_state;
    let { entities } = entity_manager;
    for (let entity_id in entities) {
      let ent = entities[entity_id]!;
      if (ent.data.floor === floor_id && ent.type_id === 'asteroid_danger') {
        entity_manager.deleteEntity(ent.id, 'reset');
      }
    }

    this.asteroids = [];
    let { asteroids } = this;
    let adist = 5;
    while (adist < TARGET_DIST) {
      let asteroid: Asteroid = {
        pos: [adist, rand.range(3)],
      };
      asteroids.push(asteroid);
      entity_manager.addEntityFromSerialized({
        type: 'asteroid_danger',
        floor: floor_id,
        pos: [adist, 2 + asteroid.pos[1], 0],
      });
      adist += 1 + rand.range(5);
    }
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
  tickLoopingSound(`ship/engine_${travel_state.speed}`);
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
  let can_shift = now - travel_state.last_shift > 500;
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
      playUISound(`ship_accelerate_${travel_state.speed}`);
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

export function doTravelGame(): void {
  assert(travel_state);
  let { asteroids, done, pos } = travel_state;
  const font = uiGetFont();
  let game_state = crawlerGameState();
  let z = Z.UI;

  let dt = getFrameDt();
  if (!travel_state.done) {
    doMotionForTravelGame(dt);
    let xpos = pos[0];
    for (let ii = 0; ii < asteroids.length; ++ii) {
      let ast = asteroids[ii];
      if (ast.pos[1] === pos[1] && xpos >= ast.pos[0] && xpos < ast.pos[0] + 0.3) {
        playUISound('ship_crash');
        travel_state.done = true;
        travel_state.won = false;
      }
    }
    if (pos[0] > TARGET_DIST) {
      travel_state.done = true;
      travel_state.won = true;
    }
    if (MODE_DEVELOPMENT && keyDownEdge(KEYS.F)) {
      travel_state.done = true;
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

  if (!(travel_state.done && !travel_state.won)) {
    pos[0] += dt * (3 + travel_state.speed * 2) * 0.001;
  }

  game_state.angle = 0;
  let ypos = travel_state.pos[1];
  for (let ii = travel_state.hblends.length - 1; ii >= 0; --ii) {
    let elem = travel_state.hblends[ii];
    elem.t += dt * 0.004;
    if (elem.t >= 1) {
      ridx(travel_state.hblends, ii);
      continue;
    }
    ypos += lerp(easeOut(elem.t, 2), elem.d, 0);
  }
  game_state.pos[0] = travel_state.pos[0];
  game_state.pos[1] = 2 + ypos;

  drawHUDPanel();
}
