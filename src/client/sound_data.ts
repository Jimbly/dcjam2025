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
    file: 'ui/button_click_01',
    volume: 1,
  }, {
    file: 'ui/button_click_02',
    volume: 1,
  }, {
    file: 'ui/button_click_03',
    volume: 1,
  }, {
    file: 'ui/button_click_04',
    volume: 1,
  }],
  button_click2: { file: 'ui/button_click/button_click_01', volume: 0.125 }, // touch movement controls - just footsteps
  // menus/general/etc

  rollover: [{
    file: 'ui/rollover_01',
    volume: 1,
  }, {
    file: 'ui/rollover_02',
    volume: 1,
  }, {
    file: 'ui/rollover_03',
    volume: 1,
  }, {
    file: 'ui/rollover_04',
    volume: 1,
  }],

  // Game sounds - Done

  footstep: [{
    file: 'footstep/metal/metal_01',
    volume: 1,
  }, {
    file: 'footstep/metal/metal_02',
    volume: 1,
  }, {
    file: 'footstep/metal/metal_03',
    volume: 1,
  }, {
    file: 'footstep/metal/metal_04',
    volume: 1,
  }, {
    file: 'footstep/metal/metal_05',
    volume: 1,
  }, {
    file: 'footstep/metal/metal_06',
    volume: 1,
  }],

  footstep_carpet: [{
    file: 'footstep/carpet/carpet_01',
    volume: 1,
  }, {
    file: 'footstep/carpet/carpet_02',
    volume: 1,
  }, {
    file: 'footstep/carpet/carpet_03',
    volume: 1,
  }, {
    file: 'footstep/carpet/carpet_04',
    volume: 1,
  }, {
    file: 'footstep/carpet/carpet_05',
    volume: 1,
  }, {
    file: 'footstep/carpet/carpet_06',
    volume: 1,
  }],

  footstep_grass: [{
    file: 'footstep/grass/grass_01',
    volume: 1,
  }, {
    file: 'footstep/grass/grass_02',
    volume: 1,
  }, {
    file: 'footstep/grass/grass_03',
    volume: 1,
  }, {
    file: 'footstep/grass/grass_04',
    volume: 1,
  }, {
    file: 'footstep/grass/grass_05',
    volume: 1,
  }, {
    file: 'footstep/grass/grass_06',
    volume: 1,
  }],

  footstep_gravel: [{
    file: 'footstep/gravel/gravel_01',
    volume: 1,
  }, {
    file: 'footstep/gravel/gravel_02',
    volume: 1,
  }, {
    file: 'footstep/gravel/gravel_03',
    volume: 1,
  }, {
    file: 'footstep/gravel/gravel_04',
    volume: 1,
  }, {
    file: 'footstep/gravel/gravel_05',
    volume: 1,
  }, {
    file: 'footstep/gravel/gravel_06',
    volume: 1,
  }],

  footstep_stone: [{
    file: 'footstep/stone/stone_01',
    volume: 1,
  }, {
    file: 'footstep/stone/stone_02',
    volume: 1,
  }, {
    file: 'footstep/stone/stone_03',
    volume: 1,
  }, {
    file: 'footstep/stone/stone_04',
    volume: 1,
  }, {
    file: 'footstep/stone/stone_05',
    volume: 1,
  }, {
    file: 'footstep/stone/stone_06',
    volume: 1,
  }],

  // loaded dynamically like music:
  // ship_engine_1: { file: 'ship/engine_1', volume: 1 },
  // ship_engine_2: { file: 'ship/engine_2', volume: 1 },
  // ship_engine_3: { file: 'ship/engine_3', volume: 1 },
  // ship_engine_4: { file: 'ship/engine_4', volume: 1 },

  ship_accelerate_2: { file: 'ship/ship_accelerate_2', volume: 1 },
  ship_accelerate_3: { file: 'ship/ship_accelerate_3', volume: 1 },
  ship_accelerate_4: { file: 'ship/ship_accelerate_4', volume: 1 },
  ship_accelerate_5: { file: 'ship/ship_accelerate_5', volume: 1 },
  ship_decelerate_1: { file: 'ship/ship_decelerate_1', volume: 1 },
  ship_decelerate_2: { file: 'ship/ship_decelerate_2', volume: 1 },
  ship_decelerate_3: { file: 'ship/ship_decelerate_3', volume: 1 },
  ship_decelerate_4: { file: 'ship/ship_decelerate_4', volume: 1 },

  // Game sounds - TODO

  ship_cannot_move: { file: 'combat/hit', volume: 1 },
  ship_crash: { file: 'ship/ship_decelerate_1', volume: 1 },
  ship_finish_failure: { file: 'ship/ship_decelerate_1', volume: 1 },
  ship_finish_success: { file: 'ship/ship_accelerate_5', volume: 1 },

  combat_start: [{ file: 'combat/combat_start_01', volume: 1 }, { file: 'combat/combat_start_02', volume: 1 }],

  combat_hero_hit_miss: { file: 'combat/hero_hit_miss_01', volume: 1 },
  combat_hero_hit_normal: { file: 'combat/hero_hit_normal_01', volume: 1 },
  combat_hero_hit_crit: { file: 'combat/hero_hit_crit_01', volume: 1 },

  combat_hero_damaged_miss: { file: 'combat/hero_damaged_01', volume: 1 },
  combat_hero_damaged_normal: { file: 'combat/hero_damaged_01', volume: 1 },
  combat_hero_damaged_crit: { file: 'combat/hero_damaged_01', volume: 1 },

  combat_alien_hit_miss: [{
    file: 'combat/alien_hit_01',
    volume: 1,
  }, {
    file: 'combat/alien_hit_02',
    volume: 1,
  }, {
    file: 'combat/alien_hit_03',
    volume: 1,
  }],

  combat_alien_hit_normal: [{
    file: 'combat/alien_hit_01',
    volume: 1,
  }, {
    file: 'combat/alien_hit_02',
    volume: 1,
  }, {
    file: 'combat/alien_hit_03',
    volume: 1,
  }],

  combat_alien_hit_crit: [{
    file: 'combat/alien_hit_01',
    volume: 1,
  }, {
    file: 'combat/alien_hit_02',
    volume: 1,
  }, {
    file: 'combat/alien_hit_03',
    volume: 1,
  }],

  combat_robot_hit_miss: [{
    file: 'combat/robot_hit_01',
    volume: 1,
  }, {
    file: 'combat/robot_hit_02',
    volume: 1,
  }, {
    file: 'combat/robot_hit_03',
    volume: 1,
  }, {
    file: 'combat/robot_hit_04',
    volume: 1,
  }, {
    file: 'combat/robot_hit_05',
    volume: 1,
  }],

  combat_robot_hit_normal: [{
    file: 'combat/robot_hit_01',
    volume: 1,
  }, {
    file: 'combat/robot_hit_02',
    volume: 1,
  }, {
    file: 'combat/robot_hit_03',
    volume: 1,
  }, {
    file: 'combat/robot_hit_04',
    volume: 1,
  }, {
    file: 'combat/robot_hit_05',
    volume: 1,
  }],

  combat_robot_hit_crit: [{
    file: 'combat/robot_hit_01',
    volume: 1,
  }, {
    file: 'combat/robot_hit_02',
    volume: 1,
  }, {
    file: 'combat/robot_hit_03',
    volume: 1,
  }, {
    file: 'combat/robot_hit_04',
    volume: 1,
  }, {
    file: 'combat/robot_hit_05',
    volume: 1,
  }],

  combat_worm_hit_miss: [{
    file: 'combat/worm_hit_01',
    volume: 1,
  }, {
    file: 'combat/worm_hit_02',
    volume: 1,
  }, {
    file: 'combat/worm_hit_03',
    volume: 1,
  }],

  combat_worm_hit_normal: [{
    file: 'combat/worm_hit_01',
    volume: 1,
  }, {
    file: 'combat/worm_hit_02',
    volume: 1,
  }, {
    file: 'combat/worm_hit_03',
    volume: 1,
  }],

  combat_worm_hit_crit: [{
    file: 'combat/worm_hit_01',
    volume: 1,
  }, {
    file: 'combat/worm_hit_02',
    volume: 1,
  }, {
    file: 'combat/worm_hit_03',
    volume: 1,
  }],

  combat_alien_damaged_miss: [{
    file: 'combat/alien_damaged_01',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_02',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_03',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_04',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_05',
    volume: 1,
  }],

  combat_alien_damaged_normal: [{
    file: 'combat/alien_damaged_01',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_02',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_03',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_04',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_05',
    volume: 1,
  }],

  combat_alien_damaged_crit: [{
    file: 'combat/alien_damaged_01',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_02',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_03',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_04',
    volume: 1,
  }, {
    file: 'combat/alien_damaged_05',
    volume: 1,
  }],

  combat_robot_damaged_miss: { file: 'combat/robot_damaged_01', volume: 1 },
  combat_robot_damaged_normal: { file: 'combat/robot_damaged_01', volume: 1 },
  combat_robot_damaged_crit: { file: 'combat/robot_damaged_01', volume: 1 },

  combat_worm_damaged_miss: [{
    file: 'combat/worm_damaged_01',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_02',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_03',
    volume: 1,
  }],

  combat_worm_damaged_normal: [{
    file: 'combat/worm_damaged_01',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_02',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_03',
    volume: 1,
  }],

  combat_worm_damaged_crit: [{
    file: 'combat/worm_damaged_01',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_02',
    volume: 1,
  }, {
    file: 'combat/worm_damaged_03',
    volume: 1,
  }],

  // note: not current implemented
  // "enemy" is a generic term for all enemies, including aliens, robots, and worms.
  //  this should play at the same time as a specific enemy sound. This can be a
  //  stretch goal if implementation is weird.
  combat_enemy_damaged_miss: { file: 'combat/enemy_damaged', volume: 1 },
  combat_enemy_damaged_normal: { file: 'combat/enemy_damaged', volume: 1 },
  combat_enemy_damaged_crit: { file: 'combat/enemy_damaged', volume: 1 },

  combat_hero_death: { file: 'combat/combat_end_01', volume: 1 },
  combat_alien_death: { file: 'combat/combat_end_01', volume: 1 },
  combat_robot_death: { file: 'combat/combat_end_01', volume: 1 },
  combat_worm_death: { file: 'combat/combat_end_01', volume: 1 },

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

  gain_item_purchase: { file: 'item/equip', volume: 1 },
  gain_item_loot: { file: 'item/equip', volume: 1 },
  gain_item_quest: { file: 'item/equip', volume: 1 },

};
