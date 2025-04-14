import { UISoundID } from 'glov/client/ui';

export const SOUND_DATA: Partial<Record<string, UISoundID | string | string[] | UISoundID[]>> = {
  // online multiplayer sounds, ignore these
  user_join: 'user_join',
  user_leave: 'user_leave',
  msg_in: 'msg_in',
  msg_err: 'msg_err',
  msg_out_err: 'msg_out_err',
  msg_out: 'msg_out',

  // UI sounds
  button_click: [{
    file: 'ui/button_click/button_click_01',
    volume: 1,
  }, {
    file: 'ui/button_click/button_click_02',
    volume: 1,
  }, {
    file: 'ui/button_click/button_click_03',
    volume: 1,
  }, {
    file: 'ui/button_click/button_click_04',
    volume: 1,
  }],
  // menus/general/etc
  // button_click2: { file: 'button_click2', volume: 1 }, // movement controls

  rollover: [{
    file: 'ui/rollover/rollover_01',
    volume: 1,
  }, {
    file: 'ui/rollover/rollover_02',
    volume: 1,
  }, {
    file: 'ui/rollover/rollover_03',
    volume: 1,
  }, {
    file: 'ui/rollover/rollover_04',
    volume: 1,
  }],

  // Game sounds - Done

  // Game sounds - TODO

  footstep: [{
    file: 'footstep/footstep1',
    volume: 0.25,
  }, {
    file: 'footstep/footstep2',
    volume: 1,
  }, {
    file: 'footstep/footstep3',
    volume: 1,
  }, {
    file: 'footstep/footstep4',
    volume: 0.5,
  }],

  combat_start: { file: 'combat/start', volume: 1 },
  combat_hero_hit_miss: { file: 'combat/hit', volume: 1 },
  combat_hero_hit_normal: { file: 'combat/hit', volume: 1 },
  combat_hero_hit_crit: { file: 'combat/hit', volume: 1 },
  combat_hero_damaged_miss: { file: 'combat/hero_damaged', volume: 1 },
  combat_hero_damaged_normal: { file: 'combat/hero_damaged', volume: 1 },
  combat_hero_damaged_crit: { file: 'combat/hero_damaged', volume: 1 },
  combat_enemy_hit_miss: { file: 'combat/hit', volume: 1 },
  combat_enemy_hit_normal: { file: 'combat/hit', volume: 1 },
  combat_enemy_hit_crit: { file: 'combat/hit', volume: 1 },
  combat_enemy_damaged_miss: { file: 'combat/enemy_damaged', volume: 1 },
  combat_enemy_damaged_normal: { file: 'combat/enemy_damaged', volume: 1 },
  combat_enemy_damaged_crit: { file: 'combat/enemy_damaged', volume: 1 },
  combat_hero_death: { file: 'combat/hero_death', volume: 1 },
  combat_enemy_death: { file: 'combat/enemy_death', volume: 1 },

  item_heal: { file: 'item/heal', volume: 1 },
  item_unusable: { file: 'item/unusable', volume: 1 },
  item_equip_head: { file: 'item/equip', volume: 1 },
  item_equip_torso: { file: 'item/equip', volume: 1 },
  item_equip_offhand: { file: 'item/equip', volume: 1 },
  item_equip_weapon: { file: 'item/equip', volume: 1 },
  item_unequip_head: { file: 'item/unequip', volume: 1 },
  item_unequip_torso: { file: 'item/unequip', volume: 1 },
  item_unequip_offhand: { file: 'item/unequip', volume: 1 },
  item_unequip_weapon: { file: 'item/unequip', volume: 1 },

};
