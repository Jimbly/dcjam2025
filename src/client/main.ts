/* eslint-disable n/global-require */
/* eslint @stylistic/comma-spacing:error*/
import * as local_storage from 'glov/client/local_storage.js'; // eslint-disable-line import/order
local_storage.setStoragePrefix('dcj25'); // Before requiring anything else that might load from this

import assert from 'assert';
import { autoAtlas, autoAtlasTextureOpts } from 'glov/client/autoatlas';
import { chatUICreate } from 'glov/client/chat_ui';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import { Font, fontCreate, fontStyle, fontStyleColored } from 'glov/client/font';
import {
  markdown_default_renderables,
  markdownImageRegisterAutoAtlas,
} from 'glov/client/markdown_renderables';
import { netInit } from 'glov/client/net';
import * as settings from 'glov/client/settings';
import { settingsSet } from 'glov/client/settings';
import { shadersSetInternalDefines } from 'glov/client/shaders';
import { textureDefaultFilters } from 'glov/client/textures';
import { uiSetPanelColor } from 'glov/client/ui';
import * as ui from 'glov/client/ui';
import { v4set } from 'glov/common/vmath';
// import './client_cmds.js'; // for side effects
import { crawlerBuildModeStartup } from './crawler_build_mode';
import { drawableSpriteLoadNear } from './crawler_entity_client';
import { crawlerOnPixelyChange, crawlerRenderSetUIClearColor } from './crawler_play.js';
import { crawlerRenderSetLODBiasRange } from './crawler_render';
import { game_height, game_width } from './globals';
import { playStartup } from './play';
import { SOUND_DATA } from './sound_data';
import { stateHighScores, titleInit, titleStartup } from './title';
import { travelStartup } from './travelmap';

const { round } = Math;

window.Z = window.Z || {};
Z.BACKGROUND = 1;
Z.COMBAT = 2;
Z.VIEWPORT_FRAME = 3;
Z.SPRITES = 10;
Z.PARTICLES = 20;
Z.CHAT = 60;
Z.UI = 100;
Z.MAP = Z.UI + 5; // also minimap
Z.FLOATERS = 125;
Z.DIALOG = 140;
Z.STATUS = 160;
Z.CHAT_FOCUSED = 100;

let fonts: Font[] | undefined;

crawlerOnPixelyChange(function (new_value: number): void {
  assert(fonts);
  engine.setFonts(fonts[new_value] || fonts[2]);
});

export let chat_ui: ReturnType<typeof chatUICreate>;

export function main(): void {
  if (engine.DEBUG || true) {
    netInit({
      engine,
      cmd_parse,
      auto_create_user: true,
      allow_anon: true,
    });
  }

  // Default style
  let antialias = false;
  let use_fbos = 1;
  let need_dfdxy = false;
  // @ts-expect-error truthy
  if (!'AA hires pixel art') {
    need_dfdxy = true;
    antialias = true; // antialiases 3D geometry edges only
    use_fbos = 0;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settingsSet('pixely', 0);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if ('AA hires HD art') {
    antialias = true; // antialiases 3D geometry edges only
    settingsSet('pixely', 0);
    settingsSet('filter', 1);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 0);
    crawlerRenderSetLODBiasRange(0, 0);
    drawableSpriteLoadNear(false);
  // @ts-expect-error truthy
  } else if (!'simple lowres') {
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'lowres with mipmapping') {
    // also antilias=true & use_fbos=0 is potentially useful
    crawlerRenderSetLODBiasRange(-3, -1.5);
    settingsSet('pixely', 1);
    settingsSet('filter', 2);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'simple AA lowres') {
    antialias = true;
    use_fbos = 0;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'CRT filter') {
    settingsSet('pixely', 2);
    settingsSet('hybrid', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'split logic') {
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 1);
  // @ts-expect-error truthy
  } else if (!'split logic filter') {
    settingsSet('pixely', 1);
    settingsSet('filter', 1);
    settingsSet('entity_split', 1);
  }
  const font_info_04b03x2 = require('./img/font/04b03_8x2.json');
  const font_info_04b03x1 = require('./img/font/04b03_8x1.json');
  const font_info_palanquin32 = require('./img/font/palanquin32.json');
  const font_info_kalam = require('./img/font/kalam.json');
  let pixely = settings.pixely === 2 ? 'strict' : settings.pixely ? 'on' : false;
  let font;
  if (pixely === 'strict') {
    font = { info: font_info_04b03x1, texture: 'font/04b03_8x1' };
  } else if (pixely && pixely !== 'off') {
    font = { info: font_info_04b03x2, texture: 'font/04b03_8x2' };
  } else {
    font = { info: font_info_palanquin32, texture: 'font/palanquin32' };
  }
  font = { info: font_info_kalam, texture: 'font/kalam' };
  settingsSet('use_fbos', use_fbos); // Needed for our effects

  autoAtlasTextureOpts('whitebox', { force_mipmaps: true });
  autoAtlasTextureOpts('utumno', { force_mipmaps: true });

  if (!engine.startup({
    game_width,
    game_height,
    pixely,
    font,
    viewport_postprocess: true,
    antialias,
    znear: 11,
    zfar: 4000,
    do_borders: false,
    show_fps: false,
    ui_sprites: {
      // ...spriteSetGet('pixely'),
      // color_set_shades: [1, 1, 1],
      // button: { name: 'button', ws: [3, 20, 3], hs: [26] },
      // button_rollover: { name: 'button_rollover', ws: [3, 20, 3], hs: [26] },
      // button_down: { name: 'button_down', ws: [3, 20, 3], hs: [26] },
      // button_disabled: { name: 'button_disabled', ws: [3, 20, 3], hs: [26] },
      buttonselected_regular: { atlas: 'pixely', name: 'buttonselected' },
      buttonselected_down: { atlas: 'pixely' },
      buttonselected_rollover: { atlas: 'pixely', name: 'buttonselected' },
      buttonselected_disabled: { atlas: 'pixely' },
      // panel: { name: 'panel', ws: [3, 2, 3], hs: [3, 10, 3] },
      // menu_entry: { name: 'menu_entry', ws: [4, 5, 4], hs: [13] },
      // menu_selected: { name: 'menu_selected', ws: [4, 5, 4], hs: [13] },
      // menu_down: { name: 'menu_down', ws: [4, 5, 4], hs: [13] },
      // menu_header: { name: 'menu_header', ws: [4, 5, 12], hs: [13] },
      // scrollbar_bottom: { name: 'scrollbar_bottom', ws: [11], hs: [11] },
      // scrollbar_trough: { name: 'scrollbar_trough', ws: [11], hs: [16] },
      // scrollbar_top: { name: 'scrollbar_top', ws: [11], hs: [11] },
      // scrollbar_handle_grabber: { name: 'scrollbar_handle_grabber', ws: [11], hs: [11] },
      // scrollbar_handle: { name: 'scrollbar_handle', ws: [11], hs: [3, 5, 3] },
    },
    ui_sounds: SOUND_DATA,
  })) {
    return;
  }
  if (!engine.webgl2 && need_dfdxy) {
    assert(gl.getExtension('OES_standard_derivatives'), 'GL_OES_standard_derivatives not supported!');
  }
  fonts = [
    fontCreate(font_info_palanquin32, 'font/palanquin32'),
    fontCreate(font_info_04b03x2, 'font/04b03_8x2'),
    fontCreate(font_info_04b03x1, 'font/04b03_8x1'),
  ];

  let build_font = fonts[0];

  gl.clearColor(1, 1, 1, 1);
  v4set(engine.border_clear_color, 1, 1, 1, 1);
  v4set(engine.border_color, 1, 1, 1, 1);
  crawlerRenderSetUIClearColor([1, 1, 1, 1]);

  // Actually not too bad:
  if (settings.filter === 1) {
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);
  } else if (settings.filter === 2) {
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.NEAREST);
  }

  ui.scaleSizes(13 / 32);
  ui.setModalSizes(0, round(game_width * 0.8), round(game_height * 0.23), 0, 0);
  ui.setFontHeight(8);
  ui.setButtonHeight(15);
  ui.setPanelPixelScale(game_height/1080);
  uiSetPanelColor([1, 1, 1, 1]);
  // ui.uiSetFontStyleFocused(fontStyle(ui.uiGetFontStyleFocused(), {
  //   outline_width: 2.5,
  //   outline_color: dawnbringer.font_colors[8],
  // }));
  ui.setFontStyles(
    fontStyleColored(null, 0x000000ff),
    fontStyle(null, {
      color: 0x000000ff,
      // outline_width: 2.5,
      // outline_color: 0xFFFFFFff,
    }),
    fontStyleColored(null, 0x000000ff),
    fontStyleColored(null, 0x808080ff),
  );

  chat_ui = chatUICreate({
    max_len: 1000,
    w: 256,
    h: 38,
    outline_width: 3,
    fade_start_time: [10000, 5000],
    fade_time: [1000, 1000],
    renderables: markdown_default_renderables, // use all system renderables
  });

  markdownImageRegisterAutoAtlas('demo');
  markdownImageRegisterAutoAtlas('default');

  crawlerBuildModeStartup({
    font: build_font,
    button_height: 11,
  });
  playStartup();
  travelStartup();
  engine.setState(titleInit);
  if (0) {
    engine.setState(stateHighScores);
  }
  titleStartup();
  // Preload some atlases
  autoAtlas('station', 'solid1');
  autoAtlas('base', 'solid1');
  autoAtlas('moon', 'solid1');
  autoAtlas('ship', 'solid1');
  autoAtlas('critters', 'critter6');
  autoAtlas('npcs', 'npc-1');
  autoAtlas('decals', 'ship-decal-1');
}
