import assert from 'assert';
import { setState } from 'glov/client/engine';
import { ALIGN, fontStyleColored } from 'glov/client/font';
import { KEYS, PAD } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import { buttonText, uiTextHeight } from 'glov/client/ui';
import { NORTH } from '../common/crawler_state';
import { crawlerEntityManager } from './crawler_entity_client';
import { crawlerController } from './crawler_play';
import { keyClear, SHUTTLE_COST } from './dialog_data';
import { game_height, game_width } from './globals';
import { autosave, myEnt, play, playStatusTick, queueTransition } from './play';
import { travelTo } from './travelgame';

let worlds_map: Sprite;

export function stateTravel(dt: number): void {
  let aspect = worlds_map.getAspect();
  let screen_aspect = game_width / game_height;
  let w = aspect < screen_aspect ? game_height * aspect : game_width;
  let h = screen_aspect < aspect ? game_width / aspect : game_height;
  worlds_map.draw({
    x: (game_width - w) / 2,
    y: (game_height - h) / 2,
    w, h,
    z: 1,
  });

  const GO_W = 32;

  let me = crawlerEntityManager() && myEnt();

  [{
    x: 131,
    y: 121,
    floor: 11,
  }, {
    x: 264.5,
    y: 121,
    floor: 12,
  }, {
    x: 58.5,
    y: 203,
    floor: 13,
  }].forEach(function (elem) {
    if (buttonText({
      ...elem,
      w: GO_W,
      text: 'GO',
    })) {
      assert(me);
      autosave();
      keyClear('shuttlekey');
      queueTransition();
      travelTo(elem.floor, 'stairs_in');
      setState(play);
    }
  });

  if (buttonText({
    x: 393,
    y: 217,
    w: GO_W,
    text: 'CANCEL',
    hotkey: KEYS.ESC,
    hotpad: PAD.CANCEL,
  })) {
    queueTransition();
    crawlerController().forceMove(NORTH);
    setState(play);
  }

  let money;
  if (me) {
    money = me.data.money;
  } else {
    money = 123;
  }
  if (money >= SHUTTLE_COST && false) {
    markdownAuto({
      font_style: fontStyleColored(null, 0x000000ff),
      x: 0, w: game_width,
      y: game_height - uiTextHeight() * 2 - 17,
      align: ALIGN.HCENTER|ALIGN.HWRAP,
      text: `FUNDS: [img=icon-currency]${money}\nCOST: [img=icon-currency]${money >= SHUTTLE_COST ? SHUTTLE_COST : 0}`,
    });
  }

  playStatusTick();
}

export function startTravel(): void {
  queueTransition();
  setState(stateTravel);
}

export function travelStartup(): void {
  worlds_map = spriteCreate({
    name: 'worlds_map',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
}
