/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
export const SHUTTLE_COST = 100;
import { ALIGN, fontStyle } from 'glov/client/font';
import { panel, PanelParam, playUISound, sprites as ui_sprites, uiGetFont, uiTextHeight } from 'glov/client/ui';
import { ridx } from 'glov/common/util';
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
import { ITEMS } from './item_defs';
import {
  giveReward,
  myEnt,
} from './play';
import { statusPush } from './status';
import { travelGameFinish } from './travelgame';
import { startTravel } from './travelmap';

const { round } = Math;

const LOSE_COST = 100;
const COST_MEDKIT = 100;
const DRINK_COST = 60;

const NAME_BOX_H = 14;
const NAME_BOX_PAD = 6;

function keyGet(name: string): boolean {
  return crawlerScriptAPI().keyGet(name);
}

function keySet(name: string): void {
  crawlerScriptAPI().keySet(name);
}

function hasItem(item_id: string): boolean {
  let { inventory } = myEnt().data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    if (inventory[ii].item_id === item_id) {
      return true;
    }
  }
  return false;
}

function consumeItem(item_id: string): void {
  let item_def = ITEMS[item_id];
  statusPush(`Lost ${item_def.name}`);
  let { inventory } = myEnt().data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    if (inventory[ii].item_id === item_id) {
      ridx(inventory, ii);
    }
  }
}

function nameRender(name: string): (param: PanelParam) => void {
  return function (param: PanelParam): void {
    let name_panel = {
      x: param.x + NAME_BOX_H/2,
      w: 0,
      y: param.y - NAME_BOX_H * 0.8,
      h: NAME_BOX_H,
      z: (param.z || Z.UI) + 0.1,
      color: param.color,
      eat_clicks: false,
    };
    let text_w = uiGetFont().draw({
      ...name_panel,
      x: name_panel.x + NAME_BOX_PAD,
      color: round((param.color?.[3] || 1) * 255),
      size: uiTextHeight() * 0.75,
      z: name_panel.z + 0.2,
      align: ALIGN.VCENTER,
      text: name,
    });
    name_panel.w = text_w + NAME_BOX_PAD * 2;
    panel(name_panel);
  };
}

function nextHatCost(): { next: string; hat_cost: number } {
  if (!keyGet('helmetfree')) {
    return { next: 'helmetfree', hat_cost: 0 };
  }
  let hat_cost = 2000;
  let options = [
    'helmet1',
    'helmet2',
    'helmet3',
    'helmet4',
  ];
  let next = '';
  for (let ii = 0; ii < options.length; ++ii) {
    if (!keyGet(options[ii])) {
      next = options[ii];
      break;
    }
    hat_cost += 100;
  }
  return { next, hat_cost };
}

export function numMedkits(): number {
  let ret = 0;
  let { inventory } = myEnt().data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    if (inventory[ii].item_id === 'med1') {
      ret += inventory[ii].count || 1;
    }
  }
  return ret;
}

function numMedkitsMessage(): string {
  return `(Med-Kits owned: ${numMedkits()})`;
}

function signWithName(name: string, message: string): void {
  dialogPush({
    custom_render: nameRender(name),
    text: message,
    transient: true,
  });
}

dialogIconsRegister({
  shuttle: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_exclamation';
  },
  hats: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    let { next, hat_cost } = nextHatCost();
    if (!next) {
      return null;
    }
    return myEnt().data.money >= hat_cost ? 'icon_exclamation' : 'icon_question';
  },
  medbay: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_exclamation';
  },
  tips: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return !keyGet('rumor1') ? 'icon_exclamation' : null;
  },
  dockingwander: () => {
    return !keyGet('lookedforship') ? 'icon_exclamation' : null;
  },
  shiptaker: () => {
    if (!keyGet('lookedforship') ||
      keyGet('foundship') && !keyGet('foundshipbyshiptaker')
    ) {
      return null;
    }
    if (keyGet('foundship')) {
      return null;
    }
    if (hasItem('key2')) {
      return 'icon_exclamation';
    }
    if (!keyGet('lookingforship')) {
      return 'icon_exclamation';
    }
    return null;
  },
  historian: () => {
    if (keyGet('lookingforship') && !keyGet('foundship')) {
      if (!keyGet('historian')) {
        return 'icon_exclamation';
      }
      return 'icon_question';
    }
    return null;
  }
});

dialogRegister({
  intro: function () {
    if (keyGet('rumor1')) {
      return;
    }
    signWithName('MONOLOGUING', 'There\'s gotta be something coming through this station worth my "talents"...  Let\'s see what the rumor mill has today.');
  },
  tips: function () {
    let name = 'THE FLIRTY ENGINEER';
    if (!keyGet('rumor1')) {
      keySet('rumor1');
      return dialogPush({
        custom_render: nameRender(name),
        text: 'I heard that THE ASCENDING SWORD is transporting THE RED DEVASATION through the station today.',
        buttons: [{
          label: 'THAT SEEMS LIKE SOMETHING SAFEST IN *MY* HANDS...'
        }],
      });
    }
    if (!keyGet('lookedforship')) {
      return signWithName(name, 'Go check out the dock for THE ASCENDING SWORD.');
    }
    return signWithName(name, 'Whatever you\'re looking for, someone in this place can probably help you.');
    // any other tips?
  },
  dockingwander: function () {
    if (!keyGet('foundship')) {
      signWithName('MONOLOGUING', 'Searching one-by-one will take forever.  Maybe one of the **shiptakers** knows where **THE ASCENDING SWORD** is.');
      keySet('lookedforship');
    }
  },
  shiptaker: function () {
    let name = 'THE OVERWORKED SHIPTAKER';
    if (!keyGet('lookedforship') ||
      keyGet('foundship') && !keyGet('foundshipbyshiptaker')
    ) {
      return signWithName(name, 'I spend all day cleaning up after your kind in the docks, I just want a drink to unwind...');
    }

    if (keyGet('foundship')) {
      return signWithName(name, 'Remember, **THE ASCENDING SWORD** is in Bay **#82**.');
    }
    if (hasItem('key2')) {
      keySet('foundship');
      keySet('foundshipbyshiptaker');
      consumeItem('key2');
      return dialogPush({
        custom_render: nameRender(name),
        text: '<insert story> **THE ASCENDING SWORD** is in Bay **#82**',
        buttons: [{
          label: 'GLAD I COULD HELP.',
        }],
      });
    }
    if (!keyGet('lookingforship')) {
      return dialogPush({
        custom_render: nameRender(name),
        text: 'I know every ship that docks or leaves this station.',
        buttons: [{
          label: `BUY HIM A DRINK (-[img=icon-currency]${DRINK_COST})`,
          cb: function () {
            if (myEnt().data.money < DRINK_COST) {
              return signWithName(name, 'Hah, you can\'t even afford a drink?  Well, you know where to find me if you want to learn anything about ships.');
            }
            keySet('lookingforship');

            dialogPush({
              custom_render: nameRender(name),
              text: '<insert story: wants THE GOLDEN ROCKET>',
              buttons: [{
                label: 'MAYBE I CAN HELP HIM WITH THAT...',
              }],
            });
          },
        }, {
          label: 'MAYBE LATER...',
          cb: function () {
            signWithName(name, 'Well, you know where to find me if you want to learn anything about ships.');
          }
        }],
      });
    }
    signWithName(name, 'The pilot who won that race is pretty well-known...');
  },
  outsideracer: function () {
    if (!keyGet('lookingforship')) {
      signWithName('MONOLOGUING', 'Hmm, it seems no one\'s home...');
    }
  },
  historian: function () {
    let name = 'THE WANDERING HISTORIAN';
    if (keyGet('lookingforship') && !keyGet('foundship')) {
      if (!keyGet('historian')) {
        keySet('historian');
        return dialogPush({
          custom_render: nameRender(name),
          text: 'THE GOLDEN ROCKET? Yes, it\'s a very sought-after trophy. The \'86 winner retired a handful of years ago to Zarenth, a town on Calliope.',
          buttons: [{
            label: 'THAT\'S REALLY INTERESTING...',
          }],
        });
      }
      return signWithName(name, 'THE GOLDEN ROCKET? The \'86 winner retired to Calliope.');
    }
    signWithName(name, '<insert generic historian dialog>');
  },
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
        (take ? `A little money goes a long way... you're out [img=icon-currency]${LOSE_COST}, but you're alive.` :
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
    if (!keyGet('rumor1')) {
      return signWithName('MONOLOGUING', 'I don\'t think I should leave the station just yet.');
    }
    let me = myEnt();
    let { money } = me.data;
    dialogPush({
      name: '',
      text: money >= SHUTTLE_COST ? `Shuttle rentals are [img=icon-currency]${SHUTTLE_COST}.` : `New around here, eh?  The shuttle normally costs [img=icon-currency]${SHUTTLE_COST}, but you look a little down on your luck, so just this once I'll rent you one for free.  Just be sure to bring it back in once piece.`,
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
  hats: function () {
    let custom_render = nameRender('THE ENTERPRISING NUTRITIONIST');
    if (!keyGet('helmetfree')) {
      return dialogPush({
        custom_render,
        text: 'Psst... Over here...',
        buttons: [{
          label: 'HULLO THERE!',
          cb: function () {
            dialogPush({
              custom_render,
              text: 'I got the freshest "hats" around.  Here, take this, first one\'s free.',
              buttons: [{
                label: 'UH, OKAY...',
                cb: function () {
                  playUISound('gain_item_purchase');
                  giveReward({ items: [{ item_id: 'helmetfree' }] });
                  keySet('helmetfree');
                }
              }],
            });
          },
        }]
      });
    }
    let { next, hat_cost } = nextHatCost();

    if (!next) {
      return dialogPush({
        custom_render,
        transient: true,
        text: 'Rest easy, and know that you have the most majestic of head accoutrements.'
      });
    }

    let me = myEnt();
    let { money } = me.data;

    if (money < hat_cost) {
      return dialogPush({
        custom_render,
        transient: true,
        text: `I've got another one saved for ya.  Come back when you have [img=icon-currency]${hat_cost}.`
      });
    }

    return dialogPush({
      custom_render,
      text: `This one will fit you perfectly.  I call it The ${ITEMS[next].name}.  Only [img=icon-currency]${hat_cost}.`,
      buttons: [{
        label: 'YES, PLEASE!',
        cb: function () {
          me.data.money -= hat_cost;
          playUISound('gain_item_purchase');
          giveReward({ items: [{ item_id: next }] });
          keySet(next);
        },
      }, {
        label: 'MAYBE LATER...',
      }]
    });
  },
  equipcheck: function () {
    let { inventory } = myEnt().data;
    let any_equippable = false;
    for (let ii = 0; ii < inventory.length; ++ii) {
      if (inventory[ii].equipped) {
        return;
      }
      let item_def = ITEMS[inventory[ii].item_id];
      if (item_def.item_type !== 'consumable') {
        any_equippable = true;
      }
    }
    if (any_equippable) {
      dialog('sign', 'HINT: EQUIP YOUR NEW ITEM IN THE INVENTORY');
    }
  },
  debug: function () {
    let { inventory } = myEnt().data;
    for (let key in ITEMS) {
      let has = false;
      for (let ii = 0; ii < inventory.length; ++ii) {
        if (inventory[ii].item_id === key) {
          has = true;
        }
      }
      if (!has) {
        inventory.push({
          item_id: key,
        });
      }
    }
    myEnt().data.money = 9999;

    dialog('sign', 'GRANTED EVERYTHING');
  },
  medbay: function () {
    let { data } = myEnt();
    let { stats, money } = data;
    let do_heal = stats.hp < stats.hp_max;
    if (do_heal) {
      stats.hp = stats.hp_max;
      playUISound('item_heal');
    }
    let prefix = do_heal ? 'I\'ve patched you up.  ' : '';
    if (money < COST_MEDKIT) {
      return signWithName('THE UNDERPAID NURSE', `${prefix}Portable Med-Kits cost [img=icon-currency]${COST_MEDKIT}.`);
    }
    dialogPush({
      custom_render: nameRender('THE UNDERPAID NURSE'),
      text: `${prefix || 'You\'re right as rain.  '}Portable Med-Kits cost [img=icon-currency]${COST_MEDKIT}.  Want one?\n${numMedkitsMessage()}`,
      buttons: [{
        label: `YES, PLEASE! (-[img=icon-currency]${COST_MEDKIT})`,
        cb: 'medbuy',
      }, {
        label: 'MAYBE LATER...',
      }]
    });
  },
  medbuy: function () {
    let { data } = myEnt();
    data.money -= COST_MEDKIT;
    giveReward({ items: [{ item_id: 'med1' }] });
    playUISound('gain_item_purchase');
    if (data.money < COST_MEDKIT) {
      return signWithName('THE UNDERPAID NURSE', 'Thank you, come again!');
    }
    dialogPush({
      custom_render: nameRender('THE UNDERPAID NURSE'),
      text: `There you go!  Want another?\n${numMedkitsMessage()}`,
      buttons: [{
        label: `THANK YOU SIR, MAY I HAVE ANOTHER! (-[img=icon-currency]${COST_MEDKIT})`,
        cb: 'medbuy',
      }, {
        label: 'THAT\'LL BE ALL, THANKS...',
      }]
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
