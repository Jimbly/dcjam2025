import assert from 'assert';
import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { autoAtlas } from 'glov/client/autoatlas';
// import * as camera2d from 'glov/client/camera2d';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ALIGN,
  Font,
  fontStyle,
  fontStyleColored,
} from 'glov/client/font';
import * as input from 'glov/client/input';
import {
  keyDown,
  keyDownEdge,
  KEYS,
  keyUpEdge,
  PAD,
  padButtonDown,
  padButtonUpEdge,
} from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { ClientChannelWorker } from 'glov/client/net';
import {
  MenuItem,
  selboxDefaultDrawItemBackground,
  selboxDefaultDrawItemText,
  SelectionBox,
  selectionBoxCreate,
  SelectionBoxDisplay,
  SelectionBoxDrawItemParams,
} from 'glov/client/selection_box';
import * as settings from 'glov/client/settings';
import {
  settingsRegister,
  settingsSet,
} from 'glov/client/settings';
import { SimpleMenu, simpleMenuCreate } from 'glov/client/simple_menu';
import {
  BLEND_ADDITIVE,
  BLEND_MULTIPLY,
  Sprite,
  spriteCreate,
} from 'glov/client/sprites';
import * as transition from 'glov/client/transition';
import {
  ButtonStateString,
  buttonText,
  drawBoxTiled,
  drawHBox,
  drawLine,
  isMenuUp,
  menuUp,
  panel,
  PanelParam,
  playUISound,
  // sprites as ui_sprites,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
  WithRequired,
} from 'glov/common/types';
import { clamp, clone } from 'glov/common/util';
import {
  v2add,
  v2same,
  vec2,
  Vec2,
  vec4,
} from 'glov/common/vmath';
import {
  CrawlerLevel,
  crawlerLoadData,
  DXY,
} from '../common/crawler_state';
import {
  aiDoFloor, aiTraitsClientStartup,
  entitiesAdjacentTo,
} from './ai';
import { cleanupCombat, combatStartup, doCombat, isDeadly } from './combat';
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
  crawlerRenderEntitiesStartup,
} from './crawler_render_entities';
import { crawlerScriptAPIDummyServer } from './crawler_script_api_client';
import { crawlerOnScreenButton } from './crawler_ui';
import { hasItem } from './dialog_data';
import { dialogMoveLocked, dialogRun, dialogStartup } from './dialog_system';
import { entitiesAt, EntityDemoClient, entityManager, Item, StatsData } from './entity_demo_client';
// import { EntityDemoClient } from './entity_demo_client';
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
  render_height,
  render_width,
  VIEWPORT_X0,
  VIEWPORT_Y0,
} from './globals';
import { ItemDef, ITEMS, ItemType } from './item_defs';
import { appTraitsStartup } from './jam_traits';
import { levelGenTest } from './level_gen_test';
import { tickMusic } from './music';
import { renderAppStartup } from './render_app';
import {
  statusPush,
  statusTick,
} from './status';
import { hasSaveData } from './title';
import { doTravelGame, travelGameActive, travelGameCheck } from './travelgame';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { ceil, cos, floor, max, min, round, sin, PI } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let turn_toggle: 0 | 1;
}

// const ATTACK_WINDUP_TIME = 1000;
const MINIMAP_RADIUS = 4;
const MINIMAP_X = 6;
const MINIMAP_Y = 6;
const MINIMAP_W = 5+7*(MINIMAP_RADIUS*2 + 1) + 7 * 2;
const MINIMAP_H = MINIMAP_W - 7 * 2;
const COMPASS_W = 50;
const COMPASS_H = 12.5;
const COMPASS_X = MINIMAP_X + (MINIMAP_W - COMPASS_W)/2;
const COMPASS_Y = MINIMAP_Y + MINIMAP_H - 3;
const LEVEL_NAME_W = 100;
const LEVEL_NAME_H = 20;
const LEVEL_SUBTITLE_H = LEVEL_NAME_H * 0.5;

type Entity = EntityDemoClient;

let font: Font;

let loading_level = false;

let controller: CrawlerController;

let pause_menu_up = false;
let inventory_up = false;
let journal_up = false;

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
let minimap_bg: Sprite;
let minimap_overlay: Sprite;
let modal_frame: Sprite;
let modal_bg_bottom_add: Sprite;
let modal_bg_top_mult: Sprite;
let modal_inventory_descr: Sprite;
let modal_label_inventory: Sprite;
let modal_label_options: Sprite;

const style_text = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x000000ff,
});

const style_label = fontStyle(null, {
  color: 0x000000ff,
});

const style_hud_value = fontStyle(null, {
  color: 0x000000ff,
  outline_width: 0.25,
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

export function queueTransition(): void {
  transition.queue(Z.TRANSITION_FINAL, transition.wipe(800, 30/180*PI));
}

const selbox_display: Partial<SelectionBoxDisplay> = {
  style_default: fontStyleColored(null, 0x000000ff),
  style_selected: fontStyleColored(null, 0x000000ff),
  style_disabled: fontStyleColored(null, 0x808080ff),
  style_down: fontStyleColored(null, 0x000000ff),
};

function modalBackground(min_w: number, min_h: number, label: Sprite | null): void {
  let modal_frame_h = min_h * 825/605;
  let modal_frame_w = max(modal_frame_h / 825 * 657,
    min_w * 657/483);
  modal_frame_h = modal_frame_w / 657 * 825;
  let box = {
    x: (game_width - modal_frame_w) / 2,
    y: (game_height - modal_frame_h) / 2,
    w: modal_frame_w,
    h: modal_frame_h,
    z: Z.MODAL + 0.3,
  };
  modal_frame.draw(box);
  modal_bg_bottom_add.draw({
    ...box,
    z: Z.MODAL + 0.1,
    blend: BLEND_ADDITIVE,
  });
  modal_bg_top_mult.draw({
    ...box,
    z: Z.MODAL + 0.2,
    blend: BLEND_MULTIPLY,
  });
  if (label) {
    let label_w = label.texs[0].src_width / 674 * 155;
    label.draw({
      x: box.x - 8,
      y: box.y - (label === modal_label_options ? 23 : 32),
      z: Z.MODAL + 0.4,
      w: label_w,
      h: label_w / label.getAspect(),
    });
  }
  menuUp();
}

const PAUSE_MENU_W = 120;
let pause_menu: SimpleMenu;
function pauseMenu(disable_saving: boolean): void {
  if (!pause_menu) {
    pause_menu = simpleMenuCreate({
      x: floor((game_width - PAUSE_MENU_W)/2),
      y: 50,
      z: Z.MODAL + 2,
      width: PAUSE_MENU_W,
      display: selbox_display,
    });
  }
  let items: MenuItem[] = [{
    name: 'RETURN TO GAME',
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
    name: `TURN: ${settings.turn_toggle ? 'A/S/4/6/←/→': 'Q/E/7/9/LB/RB'}`,
    cb: () => {
      settingsSet('turn_toggle', 1 - settings.turn_toggle);
    },
  }];
  if (isLocal()) {
    items.push({
      name: 'SAVE GAME',
      disabled: disable_saving,
      cb: function () {
        crawlerSaveGame('manual');
        statusPush('Game saved.');
        pause_menu_up = false;
      },
    });
  }
  items.push({
    name: isOnline() ? 'RETURN TO TITLE' : 'SAVE AND EXIT',
    disabled: disable_saving,
    cb: function () {
      if (!isOnline()) {
        crawlerSaveGame('manual');
      }
      queueTransition();
      urlhash.go('');
    },
  });
  if (isLocal()) {
    items.push({
      name: 'EXIT WITHOUT SAVING',
      cb: function () {
        queueTransition();
        urlhash.go('');
      },
    });
  }

  let volume_item = items[1];
  volume_item.value = settings.volume_sound;
  volume_item.name = `SFX: ${(settings.volume_sound * 100).toFixed(0)}`;
  volume_item = items[2];
  volume_item.value = settings.volume_music;
  volume_item.name = `MUS: ${(settings.volume_music * 100).toFixed(0)}`;

  let modal_contents_h = items.length * uiButtonHeight();

  pause_menu.run({
    y: (game_height - modal_contents_h) / 2,
    slider_w: 58,
    items,
  });

  settingsSet('volume_sound', pause_menu.getItem(1).value as number);
  settingsSet('volume_music', pause_menu.getItem(2).value as number);

  modalBackground(PAUSE_MENU_W, modal_contents_h, modal_label_options);
}

function shift(): boolean {
  return keyDown(KEYS.SHIFT) || padButtonDown(PAD.LEFT_TRIGGER) || padButtonDown(PAD.RIGHT_TRIGGER);
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

function engagedEnemy(): Entity | null {
  if (buildModeActive() || engine.defines.PEACE) {
    return null;
  }
  let me = crawlerMyEnt();
  // search, needs game_state, returns list of foes
  // let game_state = crawlerGameState();
  // let ents: Entity[] = entitiesAdjacentTo(game_state,
  //   entityManager(),
  //   me.data.floor, me.data.pos, crawlerScriptAPI());
  let ents = entitiesAt(entityManager(), me.data.pos, me.data.floor, true);
  ents = ents.filter((ent: Entity) => {
    if (!ent.is_enemy || !ent.isAlive()) {
      return false;
    }
    if (ent.data.stats?.tier === 4 && crawlerScriptAPI().keyGet('solvedguard')) {
      return false;
    }
    return true;
  });
  if (ents.length) {
    return ents[0];
  }
  return null;
}

function engagedChest(): Entity | null {
  if (buildModeActive()) {
    return null;
  }
  let me = crawlerMyEnt();
  let ents = entitiesAt(entityManager(), me.data.pos, me.data.floor, true);
  ents = ents.filter((ent: Entity) => {
    return ent.is_chest;
  });
  if (ents.length) {
    return ents[0];
  }
  return null;
}

let looking_at = vec2();
function facingEnemy(): Entity | null {
  if (buildModeActive() || engine.defines.PEACE) {
    return null;
  }
  let me = crawlerMyEnt();
  // search, needs game_state, returns list of foes
  let game_state = crawlerGameState();
  if (!game_state.level) {
    return null;
  }
  let ents: Entity[] = entitiesAdjacentTo(game_state,
    entityManager(),
    me.data.floor, me.data.pos, crawlerScriptAPI());
  v2add(looking_at, me.data.pos, DXY[me.data.pos[2]]);
  ents = ents.filter((ent: Entity) => {
    return ent.is_enemy && ent.isAlive() && v2same(looking_at, ent.data.pos);
  });
  if (ents.length) {
    return ents[0];
  }
  return null;
}

function moveBlocked(): boolean {
  return false;
}

// TODO: move into crawler_play?
export function addFloater(ent_id: EntityID, message: string | null, anim: string): void {
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

  y += floor(h/2);
  font.drawSizedAligned(fontStyleColored(null, 0x000000ff),
    x + floor(w/2), y - 16, z,
    uiTextHeight(), ALIGN.HCENTER|ALIGN.VBOTTOM,
    0, 0, 'You have died.');

  let slot = urlhash.get('slot') || '1';
  let button_w = uiButtonWidth();
  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Reload from last save',
    auto_focus: true,
    disabled: !hasSaveData(slot),
  })) {
    queueTransition();
    engine.postTick({
      ticks: 1,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      fn: restartFromLastSave,
    });
  }
  y += uiButtonHeight() + 16;

  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Exit to Menu',
  })) {
    queueTransition();
    urlhash.go('');
  }

  return true;
}

const STATSPAD = 8;
function statsLineEx(
  x: number, y: number, z: number, w: number,
  label: string, value: string | number, other_value?: string | number
): number {
  let text_height = uiTextHeight();
  let text_w = font.draw({
    color: 0x000000ff,
    x, y, z,
    size: text_height * 0.75,
    text: label,
  });
  let left = w - text_w;
  font.draw({
    color: 0x000000ff,
    x: x + text_w,
    y, z,
    w: left,
    size: text_height * 0.75,
    align: ALIGN.HRIGHT,
    text: new Array(floor(left / text_height*6.2)).join('.'),
  });
  let text_full_w = w;

  if (other_value && other_value !== value) {
    let value_w = font.draw({
      x,
      y: y - 3,
      z,
      w: text_full_w,
      align: ALIGN.HRIGHT,
      style: style_hud_value,
      size: text_height,
      text: String(value),
    });
    let line_start = x + text_full_w - value_w - 1;
    drawLine(line_start, y+1, x + text_full_w + 1, y+1, z + 0.1, 1, 1, [0,0,0,1]);
    font.draw({
      x: line_start - 2,
      y: y - 3,
      z,
      align: ALIGN.HRIGHT,
      style: style_hud_value,
      size: text_height,
      text: String(other_value),
    });
  } else {
    markdownAuto({
      x,
      y: y - 3,
      z,
      w: text_full_w,
      align: ALIGN.HRIGHT,
      font_style: style_hud_value,
      text_height: text_height,
      text: String(value),
    });
  }

  y += text_height * 1.5;
  return y;
}


// const HP_BAR_W = 82;
// const HP_BAR_H = 13;
// const ENEMY_HP_BAR_X = VIEWPORT_X0 + (render_width - HP_BAR_W)/2;
// const ENEMY_HP_BAR_Y = 20;
// const ENEMY_HP_BAR_H = 12;
const ENEMY_STATS_W = 82;
const ENEMY_STATS_X = VIEWPORT_X0 + (render_width - ENEMY_STATS_W)/2;
const ENEMY_STATS_Y = VIEWPORT_Y0;
const color_danger = vec4(1,0.7,0.7,1);
function drawEnemyStats(ent: Entity): void {
  let stats = ent.data.stats;
  if (!stats) {
    return;
  }
  // let { hp, hp_max } = stats;
  // let bar_h = ENEMY_HP_BAR_H;
  // let show_text = false;
  // if (input.mouseOver({
  //   x: ENEMY_HP_BAR_X, y: ENEMY_HP_BAR_Y,
  //   w: HP_BAR_W, h: bar_h,
  // })) {
  //   bar_h = HP_BAR_H;
  //   show_text = true;
  // }
  // drawHealthBar(ENEMY_HP_BAR_X, ENEMY_HP_BAR_Y, Z.UI, HP_BAR_W, bar_h, hp, hp_max, show_text);

  let box: WithRequired<PanelParam, 'z'> = {
    x: ENEMY_STATS_X,
    y: ENEMY_STATS_Y,
    z: Z.UI,
    w: ENEMY_STATS_W,
    h: 100,
    eat_clicks: false,
  };

  let x = box.x + STATSPAD;
  let y = box.y + STATSPAD;
  let z = Z.UI;
  let w = box.w - STATSPAD * 2;

  let yadv = uiTextHeight() * 1.2;
  y += 2;
  let num_stars = stats.tier || 0;
  if (num_stars) {
    y -= 4;
    markdownAuto({
      ...box,
      y,
      align: ALIGN.HCENTER,
      text: new Array(num_stars + 1).join('[img=icon-star]'),
    });
    y += yadv;
  }
  statsLineEx(x, y, z, w, 'HIT POINTS', stats.hp);
  y += yadv;
  statsLineEx(x, y, z, w, 'ATTACK', stats.attack);
  y += yadv;
  statsLineEx(x, y, z, w, 'DEFENSE', stats.defense);
  y += yadv;
  statsLineEx(x, y, z, w, 'ACCURACY', stats.accuracy);
  y += yadv;
  statsLineEx(x, y, z, w, 'DODGE', stats.dodge);
  y += yadv;

  box.h = y + STATSPAD - box.y - 5;

  if (
    isDeadly(myEnt().data.stats, stats) &&
    !(stats.tier === 4 && crawlerScriptAPI().keyGet('solvedguard'))
  ) {
    box.color = color_danger;
  }
  panel(box);

  let ww = box.w * 0.75;
  let subtitle_panel = {
    x: box.x + (box.w - ww)/2,
    w: ww,
    y: box.y - 4,
    h: LEVEL_SUBTITLE_H,
    z: box.z + 0.1,
    color: box.color,
    eat_clicks: false,
  };
  panel(subtitle_panel);
  markdownAuto({
    ...subtitle_panel,
    x: subtitle_panel.x + 2,
    w: subtitle_panel.w - 4,
    font_style: style_label,
    text_height: uiTextHeight() * 0.75,
    z: subtitle_panel.z + 0.1,
    align: ALIGN.HVCENTERFIT,
    text: stats.tier === 4 ? 'THE ESTRANGED GUARD' :
      stats.tier === 3 ? 'PATIENT SENTRY' :
      'HOSTILE',
  });

}

function bumpEntityCallback(ent_id: EntityID): void {
  // not doing bump-to-attack
  // let me = myEnt();
  // let all_entities = entityManager().entities;
  // let target_ent = all_entities[ent_id]!;
  // if (target_ent && target_ent.isAlive() && me.isAlive()) {
  //   let my_stats = me.data.stats;
  //   let enemy_stats = target_ent.data.stats;
  //   let { dam, style } = damage(my_stats, enemy_stats);
  //   addFloater(ent_id, `${style === 'miss' ? 'WHIFF!\n' : style === 'crit' ? 'CRIT!' : ''}\n-${dam}`, '');
  //   enemy_stats.hp = max(0, enemy_stats.hp - dam);
  //   if (!enemy_stats.hp) {
  //     crawlerEntityManager().deleteEntity(ent_id, 'killed');
  //   }
  // }
}

export function useNoText(): boolean {
  return input.inputTouchMode() || input.inputPadMode()/* || settings.turn_toggle*/; // DCJAM
}

function equip(stats: StatsData, item: ItemDef, is_on: boolean): void {
  let key: keyof StatsData;
  for (key in item.stats) {
    let value = item.stats[key]!;
    let dv = value * (is_on ? 1 : -1);
    stats[key] += dv;
    if (key === 'hp_max' && stats.hp > 1) {
      stats.hp += dv;
    }
  }
  stats.hp = clamp(stats.hp, 1, stats.hp_max);
}

function useItem(index: number): void {
  let me = myEnt();
  let { inventory, stats } = me.data;
  let item = inventory[index];
  let item_def = ITEMS[item.item_id];
  if (item_def.item_type === 'key') {
    // nothing to do
    playUISound('item_unusable');
  } else if (item_def.item_type === 'consumable') {
    if (stats.hp === stats.hp_max) {
      // nothing
      playUISound('item_unusable');
    } else {
      stats.hp = min(stats.hp_max, stats.hp + (item_def.stats.hp || 0));
      item.count = (item.count || 1) - 1;
      if (!item.count) {
        inventory.splice(index, 1);
      }
      playUISound('item_heal');
    }
  } else {
    // equippable
    if (item.equipped) {
      playUISound(`item_unequip_${item_def.item_type}`);
      equip(stats, item_def, false);
      item.equipped = false;
    } else {
      playUISound(`item_equip_${item_def.item_type}`);
      for (let ii = 0; ii < inventory.length; ++ii) {
        let other_item = inventory[ii];
        if (other_item.equipped) {
          let other_item_def = ITEMS[other_item.item_id];
          if (other_item_def.item_type === item_def.item_type) {
            equip(stats, other_item_def, false);
            other_item.equipped = false;
          }
        }
      }
      equip(stats, item_def, true);
      item.equipped = true;
    }
  }
}

export function useMedkit(): void {
  let me = myEnt();
  let { inventory } = me.data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    let item = inventory[ii];
    if (item.item_id === 'med1') {
      useItem(ii);
      return;
    }
  }
  assert(false);
}

let preview_stats_final: StatsData | null = null;
let inventory_selbox: SelectionBox;
const INVENTORY_W = 110;
const INVENTORY_H = 140;
const INVENTORY_X = (game_width - INVENTORY_W) / 2;
const INVENTORY_Y = (game_height - INVENTORY_H) / 2 + 3;
const INVENTORY_ENTRY_H = 15; // uiButtonHeight()
const MARKER_W = 12;

function journalMenu(): void {
  let api = crawlerScriptAPI();
  let lines = [
    ['foundship', `Find where **THE ASCENDING SWORD** is docked${api.keyGet('foundship') ? ' (Bay 82)' : ''}`],
    ['solvedguard', api.keyGet('metguard') ? 'Get past **THE ESTRANGED GUARD**' : 'Get past **THE GUARD**'],
    ['solvedsafe', 'Open the safe and grab **THE RED DEVASTATION**'],
    ['solvedescape', `Disappear into the black${hasItem('key5') ? ' (Bay 42)' : ''}`],
  ];
  let x = INVENTORY_X;
  let w = INVENTORY_W;
  let x1 = INVENTORY_X + w;
  let y = INVENTORY_Y + 12;
  let z = Z.MODAL + 3;
  let text_height = uiTextHeight();
  let line_pad = text_height;

  markdownAuto({
    x, y, z, w,
    align: ALIGN.HLEFT,
    text: '**HEIST PLANNING**',
  });
  y += text_height * 3;

  lines.forEach(function (pair) {
    let solved = api.keyGet(pair[0]);
    autoAtlas('default', `icon-checkbox-${solved ? 'checked' : 'empty'}`).draw({
      x,
      y: y - text_height * 0.5,
      z,
      w: text_height * 2,
      h: text_height * 2,
    });

    let xx = x + text_height + 8;
    y += markdownAuto({
      x: xx,
      y, z,
      w: x1 - xx,
      align: ALIGN.HWRAP,
      indent: 8,
      text: pair[1]
    }).h + line_pad;
  });
  modalBackground(INVENTORY_W, INVENTORY_H, null);
}

let temp_inventory: Item[];
function inventoryDrawItemCB(param: SelectionBoxDrawItemParams): void {
  selboxDefaultDrawItemBackground(param);
  selboxDefaultDrawItemText({
    ...param,
    x: param.x + MARKER_W,
    w: param.w - MARKER_W,
  });
  let { item_idx } = param;
  let item = temp_inventory[item_idx];
  let item_def = ITEMS[item.item_id];
  if (item.equipped) {
    autoAtlas('default', 'modal-inventory-marker').draw({
      x: param.x - MARKER_W/2,
      y: param.y + (INVENTORY_ENTRY_H - MARKER_W) / 2,
      z: param.z + 1,
      w: MARKER_W,
      h: MARKER_W,
    });
  }
  autoAtlas('default', `icon-inventory-${item_def.item_type}`).draw({
    x: param.x + MARKER_W/2,
    y: param.y + (INVENTORY_ENTRY_H - MARKER_W) / 2,
    z: param.z + 1,
    w: MARKER_W,
    h: MARKER_W,
  });
}
const selbox_display_inventory: Partial<SelectionBoxDisplay> = {
  ...selbox_display,
  draw_item_cb: inventoryDrawItemCB,
};

function itemName(item: Item): string {
  let item_def = ITEMS[item.item_id];
  return (item_def.item_type === 'consumable' ? `${item_def.name} (${item.count || 1})` : item_def.name).toUpperCase();
}

function itemTier(item: Item): number {
  let item_def = ITEMS[item.item_id];
  if (item_def.item_type === 'key' || item_def.item_type === 'consumable') {
    return -1;
  }
  let m = item.item_id.match(/^[^\d]+(\d)[^\d]?$/);
  if (m) {
    return Number(m[1]);
  }
  return -1;
}

function sortInventory(): void {
  let { inventory } = myEnt().data;
  let highest_tier_by_slot: Partial<Record<ItemType, number>> = {};
  for (let ii = 0; ii < inventory.length; ++ii) {
    let item = inventory[ii];
    let tier = itemTier(item);
    if (tier !== -1) {
      let item_def = ITEMS[item.item_id];
      highest_tier_by_slot[item_def.item_type] = max(highest_tier_by_slot[item_def.item_type] || 0, tier);
    }
  }
  inventory.sort((a, b) => {
    let defa = ITEMS[a.item_id];
    let defb = ITEMS[b.item_id];
    if (defa.item_type === 'consumable' && defb.item_type !== 'consumable') {
      return -1;
    } else if (defb.item_type === 'consumable' && defa.item_type !== 'consumable') {
      return 1;
    }
    let tier_a = itemTier(a);
    let tier_b = itemTier(b);
    let is_highest_a = highest_tier_by_slot[defa.item_type] === tier_a;
    let is_highest_b = highest_tier_by_slot[defb.item_type] === tier_b;
    if (is_highest_a && !is_highest_b) {
      return -1;
    } else if (is_highest_b && !is_highest_a) {
      return 1;
    }
    if (defa.item_type === 'key' && defb.item_type !== 'key') {
      return -1;
    } else if (defb.item_type === 'key' && defa.item_type !== 'key') {
      return 1;
    }
    if (tier_a !== tier_b) {
      return tier_b - tier_a;
    }
    return a.item_id < b.item_id ? -1 : 1;
  });
}

let desired_hp_percent = 0;
function inventoryMenu(frame_combat: boolean): void {
  let me = myEnt();
  let { inventory, stats } = me.data;
  if (autoResetSkippedFrames('inventory')) {
    desired_hp_percent = stats.hp / stats.hp_max;
  }
  let z = Z.MODAL + 3;
  if (!inventory_selbox) {
    inventory_selbox = selectionBoxCreate({
      x: INVENTORY_X + MARKER_W/2,
      y: INVENTORY_Y,
      z,
      width: INVENTORY_W - MARKER_W/2,
      scroll_height: INVENTORY_H,
      entry_height: INVENTORY_ENTRY_H,
      display: selbox_display_inventory,
      touch_focuses: true,
    });
  }
  let items: MenuItem[] = [];
  // let at_max_hp = stats.hp === stats.hp_max;
  temp_inventory = inventory;
  for (let ii = 0; ii < inventory.length; ++ii) {
    let item = inventory[ii];
    let item_def = ITEMS[item.item_id];
    items.push({
      name: itemName(item),
      disabled: item_def.item_type === 'consumable' && frame_combat,
      no_sound: true,
    });
  }
  inventory_selbox.run({
    items,
  });
  if (inventory_selbox.wasClicked()) {
    let item = inventory[inventory_selbox.selected];
    let item_def = ITEMS[item.item_id];
    useItem(inventory_selbox.selected);
    if (item_def.item_type === 'consumable') {
      desired_hp_percent = stats.hp / stats.hp_max;
    } else {
      stats.hp = clamp(round(desired_hp_percent * stats.hp_max), 1, stats.hp_max);
    }
  }

  preview_stats_final = null;
  if (inventory_selbox.selected !== -1 && inventory_selbox.isFocused()) {
    let item = inventory[inventory_selbox.selected];
    let item_def = ITEMS[item.item_id];
    if (!item.equipped) {
      preview_stats_final = {
        ...stats,
      };
      for (let ii = 0; ii < inventory.length; ++ii) {
        let other_item = inventory[ii];
        if (other_item.equipped) {
          let other_item_def = ITEMS[other_item.item_id];
          if (other_item_def.item_type === item_def.item_type) {
            equip(preview_stats_final, other_item_def, false);
          }
        }
      }
      equip(preview_stats_final, item_def, true);
      if (item_def.item_type !== 'consumable') {
        preview_stats_final.hp = clamp(round(desired_hp_percent * preview_stats_final.hp_max), 1,
          preview_stats_final.hp_max);
      }
    }

    let descr_w = 328/1920*game_width;
    let descr_h = 473/328*descr_w;
    let descr_rot = -3.15/180*PI;
    let descr_rot_adv = -3.2/180*PI;
    let descr_x = INVENTORY_X - descr_w - 6.3;
    let descr_y = (game_height - descr_h)/2 + 6;
    modal_inventory_descr.draw({
      x: descr_x,
      y: descr_y,
      z: z + 1,
      w: descr_w,
      h: descr_h,
    });

    descr_x += 6;
    descr_y += 9;
    descr_w -= 10;
    let line_height = uiTextHeight();
    function advLine(perc: number): void {
      descr_y += line_height * perc;
      descr_x -= sin(descr_rot_adv) * line_height * perc;
    }
    font.draw({
      style: style_hud_value,
      x: descr_x,
      y: descr_y,
      z: z + 2,
      w: descr_w,
      align: ALIGN.HFIT,
      rot: descr_rot,
      text: itemName(item),
    });
    advLine(1.5);
    let tier = itemTier(item);
    if (tier > 0) {
      for (let ii = 0; ii < tier; ++ii) {
        autoAtlas('default', 'icon-star').draw({
          x: descr_x + cos(descr_rot_adv) * line_height * ii,
          y: descr_y + sin(descr_rot_adv) * line_height * ii,
          w: line_height,
          h: line_height,
          rot: descr_rot,
          z: z + 2,
        });
      }
      advLine(1.5);
    }
    let any_stats = false;
    let key: keyof StatsData;
    for (key in item_def.stats) {
      let value = item_def.stats[key];
      font.draw({
        color: 0x000000ff,
        x: descr_x,
        y: descr_y,
        z: z + 2,
        rot: descr_rot,
        text: `${key === 'hp_max' ? 'MAX HP' : key.toUpperCase()} +${value}`,
      });
      advLine(1);
      any_stats = true;
    }
    if (any_stats) {
      advLine(0.5);
    }
    if (item_def.desc) {
      font.draw({
        color: 0x000000ff,
        size: line_height * 0.75,
        x: descr_x,
        y: descr_y,
        z: z + 2,
        w: descr_w,
        rot: descr_rot,
        align: ALIGN.HWRAP,
        text: item_def.desc,
      });
    }
  }

  modalBackground(INVENTORY_W, INVENTORY_H, modal_label_inventory);
}

export function giveReward(reward: { money?: number; items?: Item[] }): void {
  let me = myEnt();
  let msg: string[] = [];
  if (reward.money) {
    me.data.money += reward.money;
    msg.push(`Gained [img=icon-currency]${reward.money}`);
  }
  if (reward.items) {
    for (let ii = 0; ii < reward.items.length; ++ii) {
      let item = reward.items[ii];
      let item_def = ITEMS[item.item_id];
      assert(item_def);
      if (item_def.item_type === 'consumable') {
        let found = false;
        for (let jj = 0; jj < me.data.inventory.length; ++jj) {
          let other = me.data.inventory[jj];
          if (other.item_id === item.item_id) {
            other.count = (other.count || 1) + (item.count || 1);
            found = true;
            break;
          }
        }
        if (!found) {
          me.data.inventory.push(item);
        }
        msg.push(`Gained **${item.count || 1} ${item_def.name}**`);
      } else {
        me.data.inventory.push(item);
        msg.push(`Gained **${item_def.name}**`);
      }
    }
  }

  statusPush(msg.join('\n'));
}

export function drawHUDPanel(): void {
  panel({
    x: HUD_X0,
    y: HUD_Y0,
    z: 2,
    w: HUD_W,
    h: game_height - HUD_PAD * 2,
    color: [0.988, 0.976, 0.973, 1],
    eat_clicks: false,
  });
}

function displayHUD(frame_inventory_up: boolean, frame_combat: Entity | null): void {

  let game_state = crawlerGameState();
  let level = game_state.level;
  let text_height = uiTextHeight();
  if (level && !frame_combat) {
    let floor_title = level.props.title || `Floor ${game_state.floor_id}`;
    let floor_subtitle = level.props.subtitle || '';
    let name_panel = {
      x: VIEWPORT_X0 + render_width - LEVEL_NAME_W,
      y: VIEWPORT_Y0,
      z: 3,
      w: LEVEL_NAME_W,
      h: LEVEL_NAME_H,
      //eat_clicks: false,
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
        h: LEVEL_SUBTITLE_H,
        z: name_panel.z + 0.1,
        eat_clicks: false,
      };
      let text_w = font.draw({
        ...subtitle_panel,
        color: 0x000000ff,
        size: text_height * 0.75,
        z: name_panel.z + 0.3,
        align: ALIGN.HVCENTER,
        text: floor_subtitle,
      });
      text_w += 8;
      if (text_w > subtitle_panel.w) {
        subtitle_panel.x -= (text_w - subtitle_panel.w) / 2;
        subtitle_panel.w = text_w;
      }
      panel(subtitle_panel);
    }
  }

  const STATS_Y0 = 108;
  let y = STATS_Y0;
  function statsLine(label: string, value: string | number, other_value?: string | number): void {
    let x = HUD_X0 + STATSPAD;
    let z = frame_inventory_up ? Z.MODAL + 2 : Z.UI;
    y = statsLineEx(x, y, z, HUD_W - STATSPAD * 2, label, value, other_value);
  }

  let me = myEnt();
  if (frame_inventory_up && preview_stats_final) {
    statsLine('HIT POINTS', `${me.data.stats.hp}/${me.data.stats.hp_max}`,
      `${preview_stats_final.hp}/${preview_stats_final.hp_max}`);
    statsLine('ATTACK', me.data.stats.attack, preview_stats_final.attack);
    statsLine('DEFENSE', me.data.stats.defense, preview_stats_final.defense);
    statsLine('ACCURACY', me.data.stats.accuracy, preview_stats_final.accuracy);
    statsLine('DODGE', me.data.stats.dodge, preview_stats_final.dodge);
  } else {
    statsLine('HIT POINTS', `${me.data.stats.hp}/${me.data.stats.hp_max}`);
    statsLine('ATTACK', me.data.stats.attack);
    statsLine('DEFENSE', me.data.stats.defense);
    statsLine('ACCURACY', me.data.stats.accuracy);
    statsLine('DODGE', me.data.stats.dodge);
  }
  statsLine('FUNDS', `[img=icon-currency]${me.data.money}`);

  if (frame_inventory_up) {
    panel({
      x: HUD_X0,
      y: STATS_Y0 - HUD_PAD,
      z: Z.MODAL + 1,
      w: HUD_W,
      h: y - STATS_Y0 + HUD_PAD * 2,
      color: [0.988, 0.976, 0.973, 1],
      eat_clicks: false,
    });
  }
  drawHUDPanel();
}

function checkLoot(): void {
  let chest = engagedChest();
  if (!chest) {
    return;
  }
  let { level } = crawlerGameState();
  if (!level) {
    return;
  }
  let cell = level.getCell(chest.data.pos[0], chest.data.pos[1]);
  assert(cell);
  let loot = cell.props?.loot;
  if (!loot) {
    return;
  }
  playUISound('gain_item_loot');
  if (loot.startsWith('money')) {
    let money = Number(loot.split(' ')[1]);
    if (!isFinite(money)) {
      money = 50;
    }
    giveReward({ money });
  } else {
    if (!ITEMS[loot]) {
      statusPush(`Unknown loot "${loot}"`);
    } else {
      giveReward({ items: [{
        item_id: loot,
      }] });
    }
  }
  entityManager().deleteEntity(chest.id, 'looted');
}

export function doMotionForTravelGame(dt: number): void {
  controller.doPlayerMotion({
    dt,
    button_x0: MOVE_BUTTONS_X0,
    button_y0: MOVE_BUTTONS_Y0,
    no_visible_ui: false,
    button_w: BUTTON_W,
    button_sprites: useNoText() ? button_sprites_notext : button_sprites,
    disable_move: false,
    disable_player_impulse: false,
    show_buttons: true,
    do_debug_move: false,
    show_debug: settings.show_fps ? { x: VIEWPORT_X0, y: VIEWPORT_Y0 } : null,
    show_hotkeys: !useNoText(),
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
    journal: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge: Record<ValidKeys, number> = {
    menu: 0,
    inventory: 0,
    journal: 0,
  };

  let dt = getScaledFrameDt();

  const build_mode = buildModeActive();
  let travel_game = travelGameCheck(build_mode);
  let frame_combat = !travel_game && myEnt().isAlive() && engagedEnemy() || null;
  if (frame_combat && mapViewActive()) {
    mapViewSetActive(false);
  }
  if (!frame_combat && !crawlerController().controllerIsAnimating(0.5)) {
    checkLoot();
  }
  let allow_journal = crawlerScriptAPI().keyGet('rumor1');
  if (!allow_journal) {
    journal_up = false;
  }
  const frame_map_view = !travel_game && mapViewActive();
  const frame_inventory_up = !travel_game && inventory_up;
  const frame_journal_up = !travel_game && journal_up;
  const is_fullscreen_ui = false; // any game-mode fullscreen UIs up?
  let dialog_viewport = {
    x: VIEWPORT_X0 + 8,
    w: render_width - 16,
    y: VIEWPORT_Y0,
    h: render_height + 4,
    z: Z.STATUS,
    pad_top: 5,
    pad_bottom: 5,
  };
  if (is_fullscreen_ui || frame_map_view) {
    dialog_viewport.x = 0;
    dialog_viewport.w = game_width;
    dialog_viewport.y = 0;
    dialog_viewport.h = game_height - 3;
  }
  dialogRun(dt, dialog_viewport, false);

  let locked_dialog = dialogMoveLocked();
  const overlay_menu_up = pause_menu_up || frame_inventory_up || frame_journal_up;
  let minimap_display_x = MINIMAP_X;
  let minimap_display_h = build_mode ? BUTTON_W : MINIMAP_H;
  let show_compass = !build_mode;
  let compass_h = show_compass ? COMPASS_H : 0;

  if (build_mode && !controller.ignoreGameplay()) {
    let build_y = MINIMAP_Y + minimap_display_h + 2;
    let build_x = VIEWPORT_X0 + render_width + 2;
    minimap_display_x = build_x;
    crawlerBuildModeUI({
      x: build_x,
      y: build_y,
      w: game_width - build_x - 2,
      h: MOVE_BUTTONS_Y0 - build_y - 2,
      map_view: frame_map_view,
    });
  }


  let button_x0: number;
  let button_y0: number;

  let disabled = !travel_game && controller.hasMoveBlocker();

  function button(
    rx: number, ry: number,
    frame: number,
    key: ValidKeys,
    keys: number[],
    pads: number[],
    toggled_down: boolean,
    visible_hotkey: string,
  ): void {
    let z;
    let no_visible_ui = frame_map_view;
    let my_disabled = disabled;
    if (key === 'menu') {
      no_visible_ui = false;
      if (frame_map_view) {
        z = Z.MAP + 1;
      } else if (pause_menu_up || frame_inventory_up || frame_journal_up) {
        z = Z.MODAL + 1;
      } else {
        z = Z.MENUBUTTON;
      }
    } else {
      if (overlay_menu_up && toggled_down) {
        //no_visible_ui = true; // DCJAM25
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
      visible_hotkey: useNoText() ? undefined : visible_hotkey,
    });
    // down_edge[key] += ret.down_edge;
    down[key] += ret.down;
    up_edge[key] += ret.up_edge;
  }


  // Escape / open/close menu button - *before* pauseMenu()
  button_x0 = build_mode ? game_width - BUTTON_W - 1 : MOVE_BUTTONS_X0 + (BUTTON_W + 2) * 2;
  button_y0 = build_mode ? 1 : 15;
  let menu_up = frame_map_view || build_mode || overlay_menu_up;
  let menu_keys = [KEYS.ESC];
  let menu_pads = [PAD.START];
  if (menu_up) {
    menu_pads.push(PAD.B, PAD.BACK);
  }
  if (!travel_game) {
    button(0, 0, menu_up ? 10 : 6, 'menu', menu_keys, menu_pads, false, 'ESC');
  }
  if (!build_mode && !travel_game) {
    button(0, 1, 7, 'inventory', [KEYS.I], [PAD.Y], inventory_up || journal_up, 'I');
    if (up_edge.inventory) {
      inventory_up = !inventory_up;
      journal_up = false;
      sortInventory();
    }
    if (allow_journal) {
      button(0, 2, 8, 'journal', [KEYS.J], [PAD.X], inventory_up || journal_up, 'J');
      if (up_edge.journal) {
        journal_up = !journal_up;
        inventory_up = false;
      }
    }
  }

  if (pause_menu_up) {
    pauseMenu(travel_game);
  }

  // if (frame_combat && engagedEnemy() !== crawlerEntInFront()) {
  //   // turn to face
  //   let me = crawlerMyEnt();
  //   let dir = dirFromDelta(v2sub(temp_delta, frame_combat.data.pos, me.data.pos));
  //   controller.forceFaceDir(dir);
  // } else {
  //   controller.forceFaceDir(null);
  // }


  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  if (frame_combat) {
    // let is_boss = frame_combat.data.stats.hp_max > 30; // boss
    // if (!is_boss) {
    //   button(1, 1, 8, 'flee', [KEYS.S, KEYS.NUMPAD2, KEYS.NUMPAD5], [PAD.B, PAD.DOWN]);
    // }

    doCombat(frame_combat, dt * (shift() ? 3 : 1), menu_up || isMenuUp());
  } else {
    cleanupCombat(dt * (shift() ? 3 : 1));
  }


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
    journal_up = false;
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
        journal_up = false;
      }
      pause_menu_up = false;
    } else {
      pause_menu_up = true;
    }
  }

  if (travel_game) {
    // no hud here
  } else if (!frame_map_view) {
    if (!build_mode) {
      // Do game UI/stats here
      displayHUD(frame_inventory_up, frame_combat);
    }
    // Do modal UIs here
  } else {
    if (input.click({ button: 2 })) {
      mapViewToggle();
    }
  }
  if (!overlay_menu_up && !travel_game && !frame_combat && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK))) {
    playUISound('button_click');
    mapViewToggle();
  }
  if (inventory_up) {
    inventoryMenu(Boolean(frame_combat));
  }
  if (journal_up) {
    journalMenu();
  }
  if (travel_game) {
    doTravelGame();
  }

  let game_state = crawlerGameState();
  let script_api = crawlerScriptAPI();
  if (frame_map_view) {
    if (engine.defines.LEVEL_GEN) {
      if (levelGenTest(game_state)) {
        controller.initPosFromLevelDebug();
      }
    }
    crawlerMapViewDraw(game_state, 0, 0, game_width, game_height, 0, 0, Z.MAP,
      engine.defines.LEVEL_GEN, script_api, overlay_menu_up,
      floor((game_width - MINIMAP_W)/2), 2); // note: compass ignored, compass_h = 0 above
  } else if (!frame_combat && !travel_game) {
    if (!build_mode) {
      const OVERLAY_PAD = 1;
      let minimap_rect = {
        x: minimap_display_x - OVERLAY_PAD,
        y: MINIMAP_Y - OVERLAY_PAD,
        w: MINIMAP_W + OVERLAY_PAD * 2,
        h: minimap_display_h + OVERLAY_PAD * 2,
      };
      minimap_bg.draw({
        ...minimap_rect,
        z: Z.MAP - 1,
      });
      minimap_overlay.draw({
        ...minimap_rect,
        z: Z.MAP + 1,
      });
    }
    crawlerMapViewDraw(game_state,
      minimap_display_x, MINIMAP_Y,
      MINIMAP_W, minimap_display_h, compass_h, COMPASS_W, Z.MAP,
      false, script_api, overlay_menu_up,
      COMPASS_X, COMPASS_Y);
  }

  if (!travel_game) {
    controller.doPlayerMotion({
      dt,
      button_x0: MOVE_BUTTONS_X0,
      button_y0: build_mode ? game_height - 16 : MOVE_BUTTONS_Y0,
      no_visible_ui: frame_map_view,
      button_w: build_mode ? 6 : BUTTON_W,
      button_sprites: useNoText() ? button_sprites_notext : button_sprites,
      disable_move: moveBlocked() || overlay_menu_up,
      disable_player_impulse: Boolean(frame_combat || locked_dialog),
      show_buttons: !frame_combat && !locked_dialog,
      do_debug_move: engine.defines.LEVEL_GEN || build_mode,
      show_debug: settings.show_fps ? { x: VIEWPORT_X0, y: VIEWPORT_Y0 + (build_mode ? 3 : 0) } : null,
      show_hotkeys: !useNoText(),
    });
  }


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

  // ui_sprites.white.draw({
  //   x: camera2d.x0Real(),
  //   y: camera2d.y0Real(),
  //   z: 0.0001,
  //   w: camera2d.wReal(),
  //   h: camera2d.hReal(),
  // });

  viewport_frame.draw({
    x: 0,
    y: 0,
    z: Z.VIEWPORT_FRAME,
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

  let overlay_menu_up = Boolean(pause_menu_up || dialogMoveLocked() || inventory_up || journal_up ||
    !myEntOptional()?.isAlive() || engagedEnemy());

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

  crawlerPrepAndRenderFrame(travelGameActive() ? 30/180*PI : 0);

  // if (game_state.level && (engagedEnemy() || !crawlerController().controllerIsAnimating(0.75))) {
  //   let target_ent = engagedEnemy() || facingEnemy();
  if (game_state.level && !crawlerController().controllerIsAnimating(0.75) && !engagedEnemy()) {
    let target_ent = facingEnemy();
    if (target_ent && myEnt().isAlive()) {
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
  journal_up = false;
  travelGameCheck(true);
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

function initLevel(entity_manager: ClientEntityManagerInterface,
  floor_id: number, level: CrawlerLevel
) : void {
  let me = entity_manager.getMyEnt();
  assert(me);
  // maybe sometimes: autosave();

  if (me.data.last_floor === floor_id) {
    return;
  }
  me.data.last_floor = floor_id;

  // respawn - remove any respawning entities
  assert(!entity_manager.isOnline());
  let { entities } = entity_manager;
  for (let ent_id_str in entities) {
    let ent_id = Number(ent_id_str);
    let ent = entities[ent_id]!;
    if (ent.respawns && ent.data.floor === floor_id) {
      entity_manager.deleteEntity(ent_id, 'respawn');
    }
  }

  // respawn them
  if (level.initial_entities) {
    let initial_entities = clone(level.initial_entities);
    for (let ii = 0; ii < initial_entities.length; ++ii) {
      initial_entities[ii].floor = floor_id;
      let ent = entity_manager.addEntityFromSerialized(initial_entities[ii]);
      if (!ent.respawns) {
        entity_manager.deleteEntity(ent.id, 'respawn');
      }
    }
  }

  // reset any gameplay related script keys?
  // let { w, h } = level;
  // let script_api = crawlerScriptAPI();
  // for (let yy = 0; yy < h; ++yy) {
  //   for (let xx = 0; xx < w; ++xx) {
  //     let cell = level.getCell(xx, yy)!;
  //     if (cell.desc.code === 'BRIDGE') {
  //       let key_name = cell.getKeyNameForWall(DIR_CELL);
  //       if (key_name) {
  //         script_api.keyClear(key_name);
  //       }
  //     }
  //   }
  // }
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
    on_init_level_offline: initLevel,
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
  // button_sprites = {
  //   regular: spriteCreate({
  //     name: 'crawler_buttons/buttons',
  //     ...button_param,
  //   }),
  //   down: spriteCreate({
  //     name: 'crawler_buttons/buttons_down',
  //     ...button_param,
  //   }),
  //   rollover: spriteCreate({
  //     name: 'crawler_buttons/buttons_rollover',
  //     ...button_param,
  //   }),
  //   disabled: spriteCreate({
  //     name: 'crawler_buttons/buttons_disabled',
  //     ...button_param,
  //   }),
  // };
  // button_sprites_down = {
  //   regular: button_sprites.down,
  //   down: button_sprites.regular,
  //   rollover: button_sprites.rollover,
  //   disabled: button_sprites.disabled,
  // };
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

  button_sprites = button_sprites_notext; // DCJAM
  button_sprites_down = button_sprites_notext_down; // DCJAM

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
    name: 'viewport-frame',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  minimap_bg = spriteCreate({
    name: 'minimap-bg',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  minimap_overlay = spriteCreate({
    name: 'minimap-overlay',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_frame = spriteCreate({
    name: 'modal-frame',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_bg_bottom_add = spriteCreate({
    name: 'modal-bg-bottom-add',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_bg_top_mult = spriteCreate({
    name: 'modal-bg-top-mult',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_inventory_descr = spriteCreate({
    name: 'modal-inventory-descr',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_label_inventory = spriteCreate({
    name: 'modal-label-inventory',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
  });
  modal_label_options = spriteCreate({
    name: 'modal-label-options',
    filter_mag: gl.LINEAR,
    filter_min: gl.LINEAR,
    wrap_s: gl.CLAMP_TO_EDGE,
    wrap_t: gl.CLAMP_TO_EDGE,
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
    style_map_name: fontStyleColored(null, 0x000000ff),
    style_map_info: fontStyleColored(null, 0x000000ff),
    // compass_border_w: 6,
    hide_name_on_minimap: true,
  });
  combatStartup();
}
