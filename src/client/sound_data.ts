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
  button_click: { file: 'button_click', volume: 1 }, // menus/general/etc
  // button_click2: { file: 'button_click2', volume: 1 }, // movement controls
  rollover: { file: 'rollover', volume: 0.25 },

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
};
