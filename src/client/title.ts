/* eslint-disable @typescript-eslint/no-unused-vars */
import * as camera2d from 'glov/client/camera2d';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyleColored } from 'glov/client/font';
import { fscreenAvailable, fscreenEnter } from 'glov/client/fscreen';
import { inputTouchMode } from 'glov/client/input';
import { localStorageGetJSON } from 'glov/client/local_storage';
import { netSubs } from 'glov/client/net';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import {
  buttonText,
  modalDialog,
  print,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { TSMap } from 'glov/common/types';
import { createAccountUI } from './account_ui';
import {
  crawlerCommStart,
  crawlerCommStartup,
  crawlerCommWant,
} from './crawler_comm';
import {
  crawlerPlayWantMode,
  crawlerPlayWantNewGame,
  SavedGameData,
} from './crawler_play';
import { game_height, game_width } from './globals';
import * as main from './main';
import { tickMusic } from './music';
import { modalBackground, queueTransition } from './play';


export function hasSaveData(slot: number): boolean {
  let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
  let auto_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.auto`, { timestamp: 0 });
  return Boolean(manual_data.timestamp || auto_data.timestamp);
}

let sprite_bg: Sprite;
let sprite_name: Sprite;

const { max, random, PI } = Math;

type AccountUI = ReturnType<typeof createAccountUI>;

let account_ui: AccountUI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let critters: any[] = [];

let fs_did: TSMap<number> = {};
function fullscreenGo(key: string): void {
  if (inputTouchMode() && fscreenAvailable()) {
    fscreenEnter();
  }
  fs_did[key] = engine.getFrameIndex();
}
function fullscreenDid(key: string): boolean {
  return (fs_did[key] && fs_did[key]! >= engine.getFrameIndex() - 1) || false;
}

const label_style = fontStyleColored(null, 0x000000ff);

function title(dt: number): void {
  tickMusic('menu');
  main.chat_ui.run({
    hide: true,
  });

  camera2d.push();
  camera2d.setNormalized();
  sprite_bg.draw({
    x: 0,
    y: 0,
    z: 0.1,
    w: 1,
    h: 1,
  });
  camera2d.pop();

  {
    let CSIZE = 140;
    for (let ii = 0; ii < critters.length; ++ii) {
      let c = critters[ii];
      c.rot += dt * c.drot * 0.0001;
      (c.sprite as Sprite).draw({
        x: c.x * game_width,
        y: c.y * game_height,
        z: 0.2,
        w: CSIZE,
        h: CSIZE,
        rot: c.rot,
      });
    }
  }

  const yoffs = 10;
  sprite_name.draw({
    x: -game_width/2,
    y: -60 + yoffs,
    w: game_width * 2,
    h: game_width/2,
    z: Z.UI + 1,
  });

  let y0 = 70 + yoffs;
  let y = y0;
  if (engine.DEBUG && false) {
    let next_y = account_ui.showLogin({
      x: 10,
      y: 10,
      pad: 2,
      text_w: 120,
      label_w: 80,
      style: null,
      center: false,
      button_width: uiButtonWidth(),
      font_height_small: uiTextHeight(),
    });

    y = max(next_y + 2, y);
  }

  // let x = 10;
  // print(null, x, y, Z.UI, 'Crawler Demo');
  // x += 10;
  const PAD_BETWEEN = 8;
  const BUTTON_W = uiButtonWidth() * 0.63;
  let x = (game_width - BUTTON_W * 2 - PAD_BETWEEN) / 2;
  y += uiTextHeight() + 2;
  y += uiButtonHeight() + 4;
  let yy = 0;
  for (let ii = 0; ii < 2; ++ii) {
    let slot = ii + 1;
    let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
    // print(null, x, y, Z.UI, `Slot ${slot}`);
    let key = `lg${ii}`;
    yy = y;
    if (buttonText({
      x, y: yy, text: 'LOAD GAME',
      w: BUTTON_W,
      disabled: !hasSaveData(slot),
      in_event_cb: fullscreenGo.bind(null, key),
    }) || fullscreenDid(key)) {
      queueTransition();
      crawlerPlayWantMode('recent');
      urlhash.go(`?c=local&slot=${slot}`);
    }
    yy += uiButtonHeight() + 2;
    if (manual_data.time_played) {
      uiGetFont().draw({
        style: label_style,
        // alpha: title_alpha.button,
        x, y: yy,
        w: BUTTON_W,
        align: ALIGN.HCENTER,
        text: engine.defines.SECONDS ? `${Math.ceil(manual_data.time_played/1000)}` :
          `(${Math.ceil(manual_data.time_played/(1000*60))} mins)`
      });
    }
    yy += uiTextHeight() + 2;
    key = `ng${ii}`;
    if (buttonText({
      x, y: yy, text: 'NEW GAME', w: BUTTON_W,
      in_event_cb: fullscreenGo.bind(null, key),
    }) || fullscreenDid(key)) {
      if (manual_data.timestamp) {
        modalDialog({
          text: 'This will overwrite your existing game when you next save.  Continue?',
          buttons: {
            yes: function () {
              queueTransition();
              crawlerPlayWantNewGame();
              urlhash.go(`?c=local&slot=${slot}`);
            },
            no: null,
          }
        });
      } else {
        queueTransition();
        crawlerPlayWantNewGame();
        urlhash.go(`?c=local&slot=${slot}`);
      }
    }
    yy += uiButtonHeight();
    x += BUTTON_W + PAD_BETWEEN;
  }
  x = 10;
  y = yy + uiButtonHeight();

  let w2 = uiButtonWidth();
  if (buttonText({
    x: (game_width - w2) / 2,
    y,
    w: w2,
    text: 'HALL OF FAME',
  })) {
    // TODO
  }
  y += uiButtonHeight() * 2;

  if (buttonText({
    x: (game_width - BUTTON_W) / 2,
    y,
    w: BUTTON_W,
    text: 'CREDITS',
  })) {
    // TODO
  }
  y += uiButtonHeight() * 2;

  let subtitle_w = game_width * 0.2;
  let xfactor = 0.88;
  let yfactor = 0.88;
  uiGetFont().draw({
    style: label_style,
    x: game_width * xfactor - subtitle_w/2,
    y: game_height * yfactor - 200,
    w: subtitle_w,
    h: 400,
    align: ALIGN.HVCENTER|ALIGN.HWRAP,
    text: 'By Jimb Esser, Nico Something, Tom Wiley Something, Some Music Guy, and Steve Thompson',
  });
  if (0) {
    uiGetFont().draw({
      style: label_style,
      x: game_width * (1 - xfactor) - subtitle_w/2,
      y: game_height * yfactor - 200,
      w: subtitle_w,
      h: 400,
      align: ALIGN.HVCENTER|ALIGN.HWRAP,
      text: 'For the DUNGEON CRAWLER JAM 2025',
    });
  }

  modalBackground(BUTTON_W*2 + PAD_BETWEEN * 3, y - y0, null, Z.UI - 10, yoffs);

  // if (netSubs().loggedIn()) {
  //   if (buttonText({
  //     x, y, text: 'Online Test',
  //   })) {
  //     urlhash.go('?c=build');
  //   }
  //   y += uiButtonHeight() + 2;
  // }
  if (crawlerCommWant()) {
    crawlerCommStart();
  }
}

export function titleInit(dt: number): void {
  account_ui = account_ui || createAccountUI();
  engine.setState(title);
  title(dt);
}

export function titleStartup(): void {
  sprite_bg = spriteCreate({
    name: 'title-bg',
    wrap_s: gl.REPEAT,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  sprite_name = spriteCreate({
    name: 'title-name',
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  critters = [];
  for (let ii = 0; ii < 3; ++ii) {
    critters.push({
      x: [0.2, 0.68, 0.8][ii],
      y: [0.6, 0.8, 0.5][ii],
      // dx: random() * 2 - 1,
      // dy: random() * 2 - 1,
      rot: random() * PI * 2,
      drot: [1, -0.9, 0.87][ii],
      sprite: spriteCreate({
        name: `startscreen-critter-${ii + 1}`,
        wrap_s: gl.CLAMP_TO_EDGE,
        wrap_t: gl.CLAMP_TO_EDGE,
        origin: [0.5, 0.5],
      })
    });
  }
  crawlerCommStartup({
    lobby_state: titleInit,
    title_func: (value: string) => `Crawler Demo | "${value}"`,
    chat_ui: main.chat_ui,
  });
}
