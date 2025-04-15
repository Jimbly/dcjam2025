/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
export const SHUTTLE_COST = 100;
import { fontStyle } from 'glov/client/font';
import { PanelParam, playUISound, sprites as ui_sprites } from 'glov/client/ui';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
} from '../common/crawler_script';
import { crawlerScriptAPI } from './crawler_play';
import {
  dialog,
  dialogPush,
  dialogRegister,
} from './dialog_system';
import {
  myEnt,
} from './play';
import { statusPush } from './status';
import { travelGameFinish } from './travelgame';
import { startTravel } from './travelmap';

const LOSE_COST = 100;

dialogIconsRegister({
  shuttle: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_exclamation';
  },
});

dialogRegister({
  sign: function (param: string) {
    // param = param.replace(/NAME(\d)/g, function (a, b) {
    //   let { heroes } = myEnt().data;
    //   let idx = Number(b) % heroes.length;
    //   return heroes[idx].name;
    // });
    dialogPush({
      name: '',
      text: param,
      transient: true,
    });
  },
  travelfail: function () {
    let me = myEnt();
    let { money } = me.data;
    let take = money > LOSE_COST * 2;
    if (take) {
      me.data.money -= LOSE_COST;
    }
    dialogPush({
      name: '',
      text: 'THE PURSUER has caught you.\n' +
        (take ? `A little money goes a long way... you're out $${LOSE_COST}, but you're alive.` :
        'Your ship is ransacked, but they find nothing of value.'),
      buttons: [{
        label: 'OK',
        cb: function () {
          travelGameFinish();
        },
      }],
    });
  },
  shuttle: function () {
    let me = myEnt();
    let { money } = me.data;
    dialogPush({
      name: '',
      text: money >= SHUTTLE_COST ? `Shuttle rentals are $${SHUTTLE_COST}.` : `New around here, eh?  The shuttle normally costs $${SHUTTLE_COST}, but you look a little down on your luck, so just this once I'll rent you one for free.  Just be sure to bring it back in once piece.`,
      buttons: [{
        label: 'OK, I\'LL TAKE ONE',
        cb: function () {
          startTravel();
        },
      }, {
        label: 'MAYBE ANOTHER TIME...',
      }],
    });
  },
  // finale: function () {
  //   myEnt().data.score_won = true;
  //   setScore();
  //   statusPush('High score submitted');
  //   let hero = randomHeroSpatial();
  //   let { class_id, face, name } = hero;
  //   let class_def = CLASSES[class_id];
  //   let face_id = class_def ? (class_def.faces[face || 0] || class_def.faces[0]) : '';
  //   sapling_water_count = 0;
  //   dialogPush({
  //     name: '',
  //     text: 'Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn!',
  //     custom_render: face_id ? drawFace.bind(null, '???', 'boss') : undefined,
  //     buttons: [{
  //       label: '...',
  //       cb: function () {
  //         dialogPush({
  //           name: '',
  //           text: 'I swear he said "I hate birthdays", but that has to be wrong.',
  //           custom_render: face_id ? drawFace.bind(null, name, face_id[1]) : undefined,
  //           buttons: [{
  //             label: '...',
  //             cb: function () {
  //               dialogPush({
  //                 name: '',
  //                 text: 'The creature lies spread eagled on its back, in a pool of its own blood.' +
  //                   ' Turquoise roots wriggle out of the wound in its chest and a little sapling sprouts lavender leaves.',
  //                 buttons: [{
  //                   label: 'Water the sapling.',
  //                   cb: 'saplingwater',
  //                 }, {
  //                   label: 'Pick the sapling.',
  //                   cb: 'saplingpick',
  //                 }],
  //               });
  //             },
  //           }],
  //         });
  //       },
  //     }],
  //   });
  // },
  // saplingstay: function () {
  //   dialogPush({
  //     name: '',
  //     text: 'The sapling grows into a tall, wide, gentle tree, and your party members grow old. They lose their names, and faces, and die unafraid.',
  //     buttons: [{
  //       label: 'The end.',
  //       cb: 'end',
  //     }],
  //   });
  // },
  // end: function () {
  //   goToHallOfFame();
  //   creditsGo();
  // },
});
