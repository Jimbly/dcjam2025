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
};
