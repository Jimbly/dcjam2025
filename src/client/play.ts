import { autoAtlas } from 'glov/client/autoatlas';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import {
  ALIGN,
  Font,
  fontStyle,
} from 'glov/client/font';
import * as input from 'glov/client/input';
import {
  keyDownEdge,
  KEYS,
  keyUpEdge,
  PAD,
  padButtonUpEdge,
} from 'glov/client/input';
import { ClientChannelWorker } from 'glov/client/net';
import { MenuItem } from 'glov/client/selection_box';
import * as settings from 'glov/client/settings';
import {
  settingsRegister,
  settingsSet,
} from 'glov/client/settings';
import { SimpleMenu, simpleMenuCreate } from 'glov/client/simple_menu';
import {
  Sprite,
  spriteCreate,
} from 'glov/client/sprites';
import {
  ButtonStateString,
  buttonText,
  drawBoxTiled,
  drawHBox,
  menuUp,
  panel,
  playUISound,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
} from 'glov/common/types';
import { clamp } from 'glov/common/util';
import {
  Vec2,
} from 'glov/common/vmath';
import {
  crawlerLoadData,
} from '../common/crawler_state';
import {
  aiDoFloor, aiTraitsClientStartup,
} from './ai';
import { damage } from './combat';
// import './client_cmds';
import {
  buildModeActive,
  crawlerBuildModeUI,
} from './crawler_build_mode';
import {
  crawlerCommStart,
  crawlerCommWant,
} from './crawler_comm';
import { controllerOnBumpEntity, CrawlerController } from './crawler_controller';
import {
  crawlerEntityClientStartupEarly,
  crawlerEntityManager,
  crawlerEntityTraitsClientStartup,
  crawlerMyEnt,
  crawlerMyEntOptional,
  isLocal,
  isOnline,
} from './crawler_entity_client';
import {
  crawlerMapViewDraw,
  crawlerMapViewStartup,
  mapViewActive,
  mapViewSetActive,
  mapViewToggle,
} from './crawler_map_view';
import {
  crawlerBuildModeActivate,
  crawlerController,
  crawlerGameState,
  crawlerPlayBottomOfFrame,
  crawlerPlayInitOffline,
  crawlerPlayStartup,
  crawlerPlayTopOfFrame,
  crawlerPlayWantMode,
  crawlerPrepAndRenderFrame,
  crawlerRenderSetUIClearColor,
  crawlerSaveGame,
  crawlerScriptAPI,
  getScaledFrameDt,
} from './crawler_play';
import {
  crawlerRenderViewportSet,
} from './crawler_render';
import {
  crawlerEntInFront,
  crawlerRenderEntitiesStartup,
} from './crawler_render_entities';
import { crawlerScriptAPIDummyServer } from './crawler_script_api_client';
import { crawlerOnScreenButton } from './crawler_ui';
import { dialogMoveLocked, dialogRun, dialogStartup } from './dialog_system';
import { EntityDemoClient, entityManager } from './entity_demo_client';
// import { EntityDemoClient } from './entity_demo_client';
import {
  game_height,
  game_width,
  render_height,
  render_width,
} from './globals';
import { appTraitsStartup } from './jam_traits';
import { levelGenTest } from './level_gen_test';
import { tickMusic } from './music';
import { renderAppStartup } from './render_app';
import {
  statusPush,
  statusTick,
} from './status';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { floor, max, min, round } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let turn_toggle: 0 | 1;
}

// const ATTACK_WINDUP_TIME = 1000;
const MINIMAP_RADIUS = 3;
const MINIMAP_X = 340 + 8;
const MINIMAP_Y = 8 + 8;
const MINIMAP_W = 5+7*(MINIMAP_RADIUS*2 + 1);
const COMPASS_X = MINIMAP_X;
const COMPASS_Y = MINIMAP_Y + MINIMAP_W;
const VIEWPORT_X0 = 5;
const VIEWPORT_Y0 = 5;

type Entity = EntityDemoClient;

let font: Font;

let loading_level = false;

let controller: CrawlerController;

let pause_menu_up = false;
let inventory_up = false;

let button_sprites: Record<ButtonStateString, Sprite>;
let button_sprites_down: Record<ButtonStateString, Sprite>;
let button_sprites_notext: Record<ButtonStateString, Sprite>;
let button_sprites_notext_down: Record<ButtonStateString, Sprite>;
type BarSprite = {
  bg: Sprite;
  filled: Sprite;
  //empty: Sprite;
};
let bar_sprites: {
  healthbar: BarSprite;
};

let viewport_frame: Sprite;

const style_text = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x000000ff,
});

export function myEnt(): Entity {
  return crawlerMyEnt() as Entity;
}

export function myEntOptional(): Entity | undefined {
  return crawlerMyEntOptional() as Entity | undefined;
}

// function entityManager(): ClientEntityManagerInterface<Entity> {
//   return crawlerEntityManager() as ClientEntityManagerInterface<Entity>;
// }

const PAUSE_MENU_W = 160;
let pause_menu: SimpleMenu;
function pauseMenu(): void {
  if (!pause_menu) {
    pause_menu = simpleMenuCreate({
      x: floor((game_width - PAUSE_MENU_W)/2),
      y: 50,
      z: Z.MODAL + 2,
      width: PAUSE_MENU_W,
    });
  }
  let items: MenuItem[] = [{
    name: 'Return to game',
    cb: function () {
      pause_menu_up = false;
    },
  }, {
    name: 'SFX Vol',
    slider: true,
    value_inc: 0.05,
    value_min: 0,
    value_max: 1,
  }, {
    name: 'Mus Vol',
    slider: true,
    value_inc: 0.05,
    value_min: 0,
    value_max: 1,
  }, {
    name: `Turn: ${settings.turn_toggle ? 'A/S/4/6/←/→': 'Q/E/7/9/LB/RB'}`,
    cb: () => {
      settingsSet('turn_toggle', 1 - settings.turn_toggle);
    },
  }];
  if (isLocal()) {
    items.push({
      name: 'Save game',
      cb: function () {
        crawlerSaveGame('manual');
        statusPush('Game saved.');
        pause_menu_up = false;
      },
    });
  }
  items.push({
    name: isOnline() ? 'Return to Title' : 'Save and Exit',
    cb: function () {
      if (!isOnline()) {
        crawlerSaveGame('manual');
      }
      urlhash.go('');
    },
  });
  if (isLocal()) {
    items.push({
      name: 'Exit without saving',
      cb: function () {
        urlhash.go('');
      },
    });
  }

  let volume_item = items[1];
  volume_item.value = settings.volume_sound;
  volume_item.name = `SFX Vol: ${(settings.volume_sound * 100).toFixed(0)}`;
  volume_item = items[2];
  volume_item.value = settings.volume_music;
  volume_item.name = `Mus Vol: ${(settings.volume_music * 100).toFixed(0)}`;

  pause_menu.run({
    slider_w: 80,
    items,
  });

  settingsSet('volume_sound', pause_menu.getItem(1).value as number);
  settingsSet('volume_music', pause_menu.getItem(2).value as number);

  menuUp();
}

function drawBar(
  bar: BarSprite,
  x: number, y: number, z: number,
  w: number, h: number,
  p: number,
): void {
  const MIN_VIS_W = 4;
  let full_w = round(p * w);
  if (p > 0 && p < 1) {
    full_w = clamp(full_w, MIN_VIS_W, w - MIN_VIS_W/2);
  }
  // let empty_w = w - full_w;
  drawHBox({
    x, y, z,
    w, h,
  }, bar.bg);
  if (full_w) {
    drawBoxTiled({
      x, y,
      w: full_w, h,
      z: z + 1,
    }, bar.filled, h/100);
  }
  // if (empty_w) {
  //   let temp_x = x + full_w;
  //   if (full_w) {
  //     temp_x -= 2;
  //     empty_w += 2;
  //   }
  //   drawBox({
  //     x: temp_x, y,
  //     w: empty_w, h,
  //     z: z + 1,
  //   }, bar.empty, 1);
  // }
}

export function drawHealthBar(
  x: number, y: number, z: number,
  w: number, h: number,
  hp: number, hp_max: number,
  show_text: boolean
): void {
  drawBar(bar_sprites.healthbar, x, y, z, w, h, hp / hp_max);
  if (show_text) {
    font.drawSizedAligned(style_text, x, y + (settings.pixely > 1 ? 0.5 : 0), z+2,
      8, ALIGN.HVCENTERFIT,
      w, h, `${hp}`);
  }
}
function moveBlocked(): boolean {
  return false;
}

// TODO: move into crawler_play?
function addFloater(ent_id: EntityID, message: string | null, anim: string): void {
  let ent = crawlerEntityManager().getEnt(ent_id);
  if (ent) {
    if (message) {
      if (!ent.floaters) {
        ent.floaters = [];
      }
      ent.floaters.push({
        start: engine.frame_timestamp,
        msg: message,
      });
    }
    if (ent.triggerAnimation) {
      ent.triggerAnimation(anim);
    }
  }
}

function moveBlockDead(): boolean {
  controller.setFadeOverride(0.75);

  let y = VIEWPORT_Y0;
  let w = render_width;
  let x = VIEWPORT_X0;
  let h = render_height;
  let z = Z.UI;

  font.drawSizedAligned(null,
    x + floor(w/2), y + floor(h/2) - 16, z,
    uiTextHeight(), ALIGN.HCENTER|ALIGN.VBOTTOM,
    0, 0, 'You have died.');

  if (buttonText({
    x: x + floor(w/2 - uiButtonWidth()/2), y: y + floor(h/2), z,
    text: 'Respawn',
  })) {
    controller.goToFloor(0, 'stairs_in', 'respawn');
  }

  return true;
}

const HP_BAR_W = 82;
const HP_BAR_H = 13;
const ENEMY_HP_BAR_X = VIEWPORT_X0 + (render_width - HP_BAR_W)/2;
const ENEMY_HP_BAR_Y = 20;
const ENEMY_HP_BAR_H = 12;
function drawEnemyStats(ent: Entity): void {
  let stats: { hp: number; hp_max: number } = ent.data.stats;
  if (!stats) {
    stats = { hp: 1, hp_max: 99 };
  }
  let { hp, hp_max } = stats;
  let bar_h = ENEMY_HP_BAR_H;
  let show_text = false;
  if (input.mouseOver({
    x: ENEMY_HP_BAR_X, y: ENEMY_HP_BAR_Y,
    w: HP_BAR_W, h: bar_h,
  })) {
    bar_h = HP_BAR_H;
    show_text = true;
  }
  drawHealthBar(ENEMY_HP_BAR_X, ENEMY_HP_BAR_Y, Z.UI, HP_BAR_W, bar_h, hp, hp_max, show_text);
  // if (ent.getData('ready') && ent.isAlive()) {
  //   let start = ent.getData('ready_start');
  //   let dur = ent.getData('action_dur');
}

function bumpEntityCallback(ent_id: EntityID): void {
  let me = myEnt();
  let all_entities = entityManager().entities;
  let target_ent = all_entities[ent_id]!;
  if (target_ent && target_ent.isAlive() && me.isAlive()) {
    let my_stats = me.data.stats;
    let enemy_stats = target_ent.data.stats;
    let { dam, style } = damage(my_stats, enemy_stats);
    addFloater(ent_id, `${style === 'miss' ? 'WHIFF!\n' : style === 'crit' ? 'CRIT!' : ''}\n-${dam}`, '');
    enemy_stats.hp = max(0, enemy_stats.hp - dam);
    if (!enemy_stats.hp) {
      crawlerEntityManager().deleteEntity(ent_id, 'killed');
    }
  }
}

const BUTTON_W = 26;


function useNoText(): boolean {
  return input.inputTouchMode() || input.inputPadMode() || settings.turn_toggle;
}

const HUD_PAD = 8;
const HUD_W_FULL = game_width - (VIEWPORT_X0 + render_width + VIEWPORT_X0); // 110
const HUD_X0 = game_width - HUD_W_FULL + 2; // 340
const HUD_W = game_width - HUD_PAD - HUD_X0; // 100
const HUD_Y0 = HUD_PAD;

const MOVE_BUTTONS_X0 = HUD_X0 + (HUD_W - BUTTON_W * 3) / 2 - 1;
const MOVE_BUTTONS_Y0 = game_height - 71;

const LEVEL_NAME_W = 100;

let style_hud_value = fontStyle(null, {
  color: 0x000000ff,
  outline_width: 0.25,
  outline_color: 0x000000ff,
});
function displayHUD(): void {

  let game_state = crawlerGameState();
  let level = game_state.level;
  let text_height = uiTextHeight();
  if (level) {
    let floor_title = level.props.title || `Floor ${game_state.floor_id}`;
    let floor_subtitle = level.props.subtitle || '';
    let name_panel = {
      x: VIEWPORT_X0 + render_width - LEVEL_NAME_W,
      y: VIEWPORT_Y0,
      z: 3,
      w: LEVEL_NAME_W,
      h: 20,
    };
    panel(name_panel);
    font.draw({
      ...name_panel,
      color: 0x000000ff,
      size: text_height,
      z: name_panel.z + 0.3,
      align: ALIGN.HVCENTERFIT,
      text: floor_title,
    });
    if (floor_subtitle) {
      let subtitle_panel = {
        x: name_panel.x + name_panel.w * 0.25,
        w: name_panel.w * 0.5,
        y: name_panel.y + name_panel.h - 4,
        h: name_panel.h * 0.5,
        z: name_panel.z + 0.1,
      };
      panel(subtitle_panel);
      font.draw({
        ...subtitle_panel,
        color: 0x000000ff,
        size: text_height * 0.75,
        z: name_panel.z + 0.3,
        align: ALIGN.HVCENTERFIT,
        text: floor_subtitle,
      });
    }
  }

  let y = 108;
  function statsLine(label: string, value: string | number): void {
    const STATSPAD = 8;
    let x = HUD_X0 + STATSPAD;
    let text_w = font.draw({
      color: 0x000000ff,
      x,
      y,
      size: text_height * 0.75,
      text: label,
    });
    let left = HUD_W - text_w - STATSPAD * 2;
    font.draw({
      color: 0x000000ff,
      x: x + text_w,
      w: left,
      y: y,
      size: text_height * 0.75,
      align: ALIGN.HRIGHT,
      text: new Array(floor(left / text_height*6.2)).join('.'),
    });
    font.draw({
      x,
      y: y - 3,
      w: HUD_W - STATSPAD * 2,
      align: ALIGN.HRIGHT,
      style: style_hud_value,
      size: text_height,
      text: String(value),
    });
    y += text_height * 1.5;
  }

  let me = myEnt();
  statsLine('HIT POINTS', `${me.data.stats.hp}/${me.data.stats.hp_max}`);
  statsLine('ATTACK', me.data.stats.attack);
  statsLine('DEFENSE', me.data.stats.defense);
  statsLine('ACCURACY', me.data.stats.accuracy);
  statsLine('DODGE', me.data.stats.dodge);
  statsLine('FUNDS', me.data.money);

  panel({
    x: HUD_X0,
    y: HUD_Y0,
    z: 2,
    w: HUD_W,
    h: game_height - HUD_PAD * 2,
    color: [0.988, 0.976, 0.973, 1],
  });
}

function playCrawl(): void {
  profilerStartFunc();

  if (!controller.canRun()) {
    return profilerStopFunc();
  }

  if (!controller.hasMoveBlocker() && !myEnt().isAlive()) {
    controller.setMoveBlocker(moveBlockDead);
  }

  let down = {
    menu: 0,
    inventory: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge = {
    menu: 0,
    inventory: 0,
  } as Record<ValidKeys, number>;

  let dt = getScaledFrameDt();

  const frame_map_view = mapViewActive();
  const is_fullscreen_ui = false; // any game-mode fullscreen UIs up?
  let dialog_viewport = {
    x: VIEWPORT_X0 + 8,
    w: render_width - 16,
    y: VIEWPORT_Y0,
    h: render_height + 4,
    z: Z.STATUS,
    pad_top: 2,
    pad_bottom: 4,
  };
  if (is_fullscreen_ui || frame_map_view) {
    dialog_viewport.x = 0;
    dialog_viewport.w = game_width;
    dialog_viewport.y = 0;
    dialog_viewport.h = game_height - 3;
  }
  dialogRun(dt, dialog_viewport, false);

  const build_mode = buildModeActive();
  let locked_dialog = dialogMoveLocked();
  const overlay_menu_up = pause_menu_up || inventory_up;
  let minimap_display_h = build_mode ? BUTTON_W : MINIMAP_W;
  let show_compass = !build_mode;
  let compass_h = show_compass ? 11 : 0;

  if (build_mode && !controller.ignoreGameplay()) {
    let build_y = MINIMAP_Y + minimap_display_h + 2;
    crawlerBuildModeUI({
      x: MINIMAP_X,
      y: build_y,
      w: game_width - MINIMAP_X - 2,
      h: MOVE_BUTTONS_Y0 - build_y - 2,
      map_view: frame_map_view,
    });
  }


  let button_x0: number;
  let button_y0: number;

  let disabled = controller.hasMoveBlocker();

  function button(
    rx: number, ry: number,
    frame: number,
    key: ValidKeys,
    keys: number[],
    pads: number[],
    toggled_down?: boolean
  ): void {
    let z;
    let no_visible_ui = frame_map_view;
    let my_disabled = disabled;
    if (key === 'menu') {
      no_visible_ui = false;
      if (frame_map_view) {
        z = Z.MAP + 1;
      } else if (pause_menu_up) {
        z = Z.MODAL + 1;
      } else {
        z = Z.MENUBUTTON;
      }
    } else {
      if (overlay_menu_up && toggled_down) {
        no_visible_ui = true;
      } else {
        my_disabled = my_disabled || overlay_menu_up;
      }
    }
    let ret = crawlerOnScreenButton({
      x: button_x0 + (BUTTON_W + 2) * rx,
      y: button_y0 + (BUTTON_W + 2) * ry,
      z,
      w: BUTTON_W, h: BUTTON_W,
      frame,
      keys,
      pads,
      no_visible_ui,
      do_up_edge: true,
      disabled: my_disabled,
      button_sprites: useNoText() ?
        toggled_down ? button_sprites_notext_down : button_sprites_notext :
        toggled_down ? button_sprites_down : button_sprites,
    });
    // down_edge[key] += ret.down_edge;
    down[key] += ret.down;
    up_edge[key] += ret.up_edge;
  }


  // Escape / open/close menu button - *before* pauseMenu()
  button_x0 = MOVE_BUTTONS_X0 + (BUTTON_W + 2) * 2;
  button_y0 = 15;
  let menu_up = frame_map_view || build_mode || overlay_menu_up;
  let menu_keys = [KEYS.ESC];
  let menu_pads = [PAD.START];
  if (menu_up) {
    menu_pads.push(PAD.B, PAD.BACK);
  }
  button(0, 0, menu_up ? 10 : 6, 'menu', menu_keys, menu_pads);
  if (!build_mode) {
    button(0, 1, 7, 'inventory', [KEYS.I], [PAD.Y], inventory_up);
    if (up_edge.inventory) {
      inventory_up = !inventory_up;
    }
  }

  if (pause_menu_up) {
    pauseMenu();
  }

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  // Check for intentional events
  // if (!build_mode) {
  //   button(2, -3, 7, 'inventory', [KEYS.I], [PAD.X], inventory_up);
  // }
  //
  // if (up_edge.inventory) {
  //   inventory_up = !inventory_up;
  // }

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  if (keyUpEdge(KEYS.B)) {
    crawlerBuildModeActivate(!build_mode);
    if (crawlerCommWant()) {
      return profilerStopFunc();
    }
    inventory_up = false;
  }

  if (up_edge.menu) {
    if (menu_up) {
      if (build_mode && mapViewActive()) {
        mapViewSetActive(false);
        // but stay in build mode
      } else if (build_mode) {
        crawlerBuildModeActivate(false);
      } else {
        // close everything
        mapViewSetActive(false);
        inventory_up = false;
      }
      pause_menu_up = false;
    } else {
      pause_menu_up = true;
    }
  }

  if (!frame_map_view) {
    if (!build_mode) {
      // Do game UI/stats here
      displayHUD();
    }
    // Do modal UIs here
  } else {
    if (input.click({ button: 2 })) {
      mapViewToggle();
    }
  }
  if (!overlay_menu_up && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK))) {
    playUISound('button_click');
    mapViewToggle();
  }
  // inventoryMenu();

  let game_state = crawlerGameState();
  let script_api = crawlerScriptAPI();
  if (frame_map_view) {
    if (engine.defines.LEVEL_GEN) {
      if (levelGenTest(game_state)) {
        controller.initPosFromLevelDebug();
      }
    }
    crawlerMapViewDraw(game_state, 0, 0, game_width, game_height, 0, Z.MAP,
      engine.defines.LEVEL_GEN, script_api, overlay_menu_up,
      floor((game_width - MINIMAP_W)/2), 2); // note: compass ignored, compass_h = 0 above
  } else {
    crawlerMapViewDraw(game_state, MINIMAP_X, MINIMAP_Y, MINIMAP_W, minimap_display_h, compass_h, Z.MAP,
      false, script_api, overlay_menu_up,
      COMPASS_X, COMPASS_Y);
  }

  controller.doPlayerMotion({
    dt,
    button_x0: MOVE_BUTTONS_X0,
    button_y0: build_mode ? game_height - 16 : MOVE_BUTTONS_Y0,
    no_visible_ui: frame_map_view,
    button_w: build_mode ? 6 : BUTTON_W,
    button_sprites: useNoText() ? button_sprites_notext : button_sprites,
    disable_move: moveBlocked() || overlay_menu_up,
    disable_player_impulse: Boolean(locked_dialog),
    show_buttons: !locked_dialog,
    do_debug_move: engine.defines.LEVEL_GEN || build_mode,
    show_debug: settings.show_fps ? { x: VIEWPORT_X0, y: VIEWPORT_Y0 + (build_mode ? 3 : 0) } : null,
  });


  statusTick(dialog_viewport);

  profilerStopFunc();
}

export function play(dt: number): void {
  let game_state = crawlerGameState();
  if (crawlerCommWant()) {
    // Must have been disconnected?
    crawlerCommStart();
    return;
  }

  viewport_frame.draw({
    x: 0,
    y: 0,
    z: 0.1,
    w: game_height * 1957/1440,
    h: game_height,
  });
  crawlerRenderViewportSet({
    x: VIEWPORT_X0,
    y: VIEWPORT_Y0,
    w: render_width,
    h: render_height,
  });
  // crawlerRenderViewportSet({
  //   x: camera2d.x0Real(),
  //   y: camera2d.y0Real(),
  //   w: camera2d.wReal(),
  //   h: camera2d.hReal(),
  // });

  let overlay_menu_up = pause_menu_up || dialogMoveLocked() || inventory_up;

  tickMusic(game_state.level?.props.music || 'bgm01');
  crawlerPlayTopOfFrame(overlay_menu_up);

  if (keyDownEdge(KEYS.F3)) {
    settingsSet('show_fps', 1 - settings.show_fps);
  }
  // if (keyDownEdge(KEYS.F)) {
  //   settingsSet('filter', 1 - settings.filter);
  // }
  // if (keyDownEdge(KEYS.G)) {
  //   const types = ['instant', 'instantblend', 'queued', 'queued2'];
  //   let type_idx = types.indexOf(controller.getControllerType());
  //   type_idx = (type_idx + (keyDown(KEYS.SHIFT) ? -1 : 1) + types.length) % types.length;
  //   controller.setControllerType(types[type_idx]);
  //   statusPush(`Controller: ${types[type_idx]}`);
  // }

  playCrawl();

  crawlerPrepAndRenderFrame();

  if (game_state.level && !crawlerController().controllerIsAnimating(0.75)) {
    let all_entities = entityManager().entities;
    let ent_in_front = crawlerEntInFront();
    if (ent_in_front && myEnt().isAlive()) {
      let target_ent = all_entities[ent_in_front]!;
      drawEnemyStats(target_ent);
    }
  }

  if (!loading_level && !buildModeActive()) {
    let script_api = crawlerScriptAPI();
    script_api.is_visited = true; // Always visited for AI
    aiDoFloor(game_state.floor_id, game_state, entityManager(), engine.defines,
      settings.ai_pause || engine.defines.LEVEL_GEN || overlay_menu_up, script_api);
  }

  crawlerPlayBottomOfFrame();
}

function onPlayerMove(old_pos: Vec2, new_pos: Vec2): void {
  // let game_state = crawlerGameState();
  // aiOnPlayerMoved(game_state, myEnt(), old_pos, new_pos,
  //   settings.ai_pause || engine.defines.LEVEL_GEN, script_api);
}

function onInitPos(): void {
  // autoAttackCancel();
}

function playInitShared(online: boolean): void {
  controller = crawlerController();

  controller.setOnPlayerMove(onPlayerMove);
  controller.setOnInitPos(onInitPos);

  pause_menu_up = false;
  inventory_up = false;
}


function playOfflineLoading(): void {
  // TODO
}

function playInitOffline(): void {
  playInitShared(false);
}

function playInitEarly(room: ClientChannelWorker): void {

  // let room_public_data = room.getChannelData('public') as { seed: string };
  // game_state.setSeed(room_public_data.seed);

  playInitShared(true);
}

export function autosave(): void {
  crawlerSaveGame('auto');
  statusPush('Auto-saved.');
}

export function restartFromLastSave(): void {
  crawlerPlayWantMode('recent');
  crawlerPlayInitOffline();
}

settingsRegister({
  ai_pause: {
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
  turn_toggle: {
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
});

export function playStartup(): void {
  font = uiGetFont();
  crawlerScriptAPIDummyServer(true); // No script API running on server
  crawlerPlayStartup({
    // on_broadcast: onBroadcast,
    play_init_online: playInitEarly,
    play_init_offline: playInitOffline,
    offline_data: {
      new_player_data: {
        type: 'player',
        pos: [0, 0, 0],
        floor: 0,
        stats: { hp: 10, hp_max: 10 },
      },
      loading_state: playOfflineLoading,
    },
    play_state: play,
    // on_init_level_offline: initLevel,
    default_vstyle: 'demo',
    allow_offline_console: engine.DEBUG,
    chat_ui_param: {
      x: 3,
      y_bottom: game_height,
      border: 2,
      scroll_grow: 2,
      cuddly_scroll: true,
    },
  });
  crawlerEntityClientStartupEarly();
  aiTraitsClientStartup();
  appTraitsStartup();
  crawlerEntityTraitsClientStartup({
    name: 'EntityDemoClient',
    Ctor: EntityDemoClient,
  });
  crawlerRenderEntitiesStartup(font);
  crawlerRenderViewportSet({
    x: VIEWPORT_X0,
    y: VIEWPORT_Y0,
    w: render_width,
    h: render_height,
  });
  crawlerRenderSetUIClearColor([1,1,1,1]);

  let button_param = {
    // filter_min: gl.NEAREST,
    // filter_mag: gl.NEAREST,
    ws: [128, 128, 128],
    hs: [128, 128, 128, 128],
  };
  button_sprites = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_disabled',
      ...button_param,
    }),
  };
  button_sprites_down = {
    regular: button_sprites.down,
    down: button_sprites.regular,
    rollover: button_sprites.rollover,
    disabled: button_sprites.disabled,
  };
  button_sprites_notext = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons_notext',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_notext_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_notext_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_notext_disabled',
      ...button_param,
    }),
  };
  button_sprites_notext_down = {
    regular: button_sprites_notext.down,
    down: button_sprites_notext.regular,
    rollover: button_sprites_notext.rollover,
    disabled: button_sprites_notext.disabled,
  };

  // let bar_param = {
  //   filter_min: gl.NEAREST,
  //   filter_mag: gl.NEAREST,
  //   ws: [2, 4, 2],
  //   hs: [2, 4, 2],
  // };
  // let healthbar_bg = spriteCreate({
  //   name: 'crawler_healthbar_bg',
  //   ...bar_param,
  // });
  bar_sprites = {
    healthbar: {
      bg: autoAtlas('default', 'crawler_healthbar_bg'),
      filled: autoAtlas('default', 'crawler_healthbar_filled'),
      // bg: healthbar_bg,
      // hp: spriteCreate({
      //   name: 'crawler_healthbar_hp',
      //   ...bar_param,
      // }),
      // empty: spriteCreate({
      //   name: 'crawler_healthbar_empty',
      //   ...bar_param,
      // }),
    },
  };

  viewport_frame = spriteCreate({
    name: 'viewport_frame',
  });

  controllerOnBumpEntity(bumpEntityCallback);

  renderAppStartup();
  dialogStartup({
    font,
    // text_style_cb: dialogTextStyle,
  });
  crawlerLoadData(webFSAPI());
  crawlerMapViewStartup({
    allow_pathfind: true,
    // color_rollover: dawnbringer.colors[8],
    build_mode_entity_icons: {},
    // style_map_name: fontStyle(...)
    compass_border_w: 6,
    hide_name_on_minimap: true,
  });
}
