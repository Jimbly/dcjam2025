/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
export const SHUTTLE_COST = 100;
import { cmd_parse } from 'glov/client/cmds';
import { ALIGN, fontStyle } from 'glov/client/font';
import { inputTouchMode } from 'glov/client/input';
import { panel, PanelParam, playUISound, sprites as ui_sprites, uiGetFont, uiTextHeight } from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { ridx } from 'glov/common/util';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
} from '../common/crawler_script';
import { crawlerScriptAPI } from './crawler_play';
import { creditsGo } from './credits';
import {
  dialog,
  dialogPush,
  dialogRegister,
} from './dialog_system';
import { entitiesAt, entityManager } from './entity_demo_client';
import { ITEMS } from './item_defs';
import {
  autosave,
  giveReward,
  itemTier,
  myEnt,
  myEntOptional,
  queueTransition,
  setScore,
} from './play';
import { statusPush } from './status';
import { travelGameFinish } from './travelgame';
import { startTravel } from './travelmap';

const { round } = Math;

const LOSE_COST = 100;
const COST_MEDKIT = 100;
const DRINK_COST = 60;
const COST_ASSIST_BRIBE = 1500;
const COST_ESCAPE = 1000;

const NAME_BOX_H = 14;
const NAME_BOX_PAD = 6;

function keyGet(name: string): boolean {
  return crawlerScriptAPI().keyGet(name);
}

function keySet(name: string): void {
  crawlerScriptAPI().keySet(name);
}

export function keyClear(name: string): void {
  crawlerScriptAPI().keyClear(name);
}

export function hasItem(item_id: string): boolean {
  let { inventory } = myEnt().data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    if (inventory[ii].item_id === item_id) {
      return true;
    }
  }
  return false;
}

function consumeMoney(amount: number, deduct_from_wealth: boolean): void {
  statusPush(`Lost [img=icon-currency]${amount}`);
  myEnt().data.money -= amount;
  if (deduct_from_wealth) {
    myEnt().data.score_money -= amount;
  }
}

function consumeItem(item_id: string): void {
  let item_def = ITEMS[item_id];
  statusPush(`Lost **${item_def.name}**`);
  let { inventory } = myEnt().data;
  for (let ii = 0; ii < inventory.length; ++ii) {
    if (inventory[ii].item_id === item_id) {
      ridx(inventory, ii);
    }
  }
}

function killEntWhereIStand(type_id: string): void {
  let api = crawlerScriptAPI();
  let ents = entitiesAt(entityManager(), api.pos, api.getFloor(), true);
  ents = ents.filter((ent) => {
    return ent.type_id === type_id;
  });
  if (ents.length) {
    entityManager().deleteEntity(ents[0].id, 'story');
  }
}

function killEntOnFloor(type_id: string): void {
  let api = crawlerScriptAPI();
  let { entities } = entityManager();
  let floor_id = api.getFloor();
  for (let key in entities) {
    let ent = entities[key]!;
    if (!ent.fading_out && ent.type_id === type_id && ent.data.floor === floor_id) {
      entityManager().deleteEntity(ent.id, 'story');
    }
  }
}

export function onetimeEventForPos(x: number, y: number, query_only?: boolean): boolean {
  let me = myEntOptional();
  let events_done = me ? me.data.events_done = me.data.events_done || {} : {};
  let pos_key = `${crawlerScriptAPI().getFloor()},${x},${y}`;
  if (events_done[pos_key]) {
    return false;
  }
  if (!query_only) {
    events_done[pos_key] = true;
  }
  return true;
}

export function onetimeEvent(query_only?: boolean): boolean {
  let pos = crawlerScriptAPI().pos;
  return onetimeEventForPos(pos[0], pos[1], query_only);
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

export function signWithName(name: string, message: string, transient_long?: boolean): void {
  dialogPush({
    custom_render: name ? nameRender(name) : undefined,
    text: message,
    transient: true,
    transient_long,
  });
}

dialogRegister({
  intro: function () {
    if (keyGet('rumor1')) {
      return;
    }
    signWithName('MONOLOGUING', 'There\'s gotta be something coming through this station worth my "talents"...  Let\'s see what the rumor mill has today.', true);
  },
});

dialogRegister({
  nilo: function () {
    signWithName('NILO', 'What...?  How did I get here?  I saw that weird cat and followed it and ended up here...');
  }
});


dialogRegister({
  theship1: function () {
    if (!keyGet('enteredship')) {
      keySet('foundship');
      keySet('enteredship');
      return signWithName('MONOLOGUING', 'Ah, this must be **THE ASCENDING SWORD**.  Surely **THE RED DEVASTATION** must be onboard somewhere, locked in a safe, beyond that guard.', true);
    }
  },
  theship2: function () {
    let name = 'THE ESTRANGED GUARD';
    if (keyGet('solvedguard')) {
      return;
      // return dialogPush({
      //   text: '**THE ESTRANGED GUARD** looks the other way...',
      //   transient: true,
      // });
    }
    if (hasItem('key1')) {
      keySet('metguard');
      return dialogPush({
        custom_render: nameRender(name),
        text: 'I told you to leave!',
        buttons: [{
          label: 'I HEARD THAT YOU HAVE AN IMPORTANT DAY COMING UP... (give **GIFT**)',
          cb: function () {
            dialogPush({
              custom_render: nameRender(name),
              text: '**THE DAZZLING GIFT**?  How much do you want for it?',
              buttons: [{
                label: 'NO MONEY.  I JUST NEED YOU TO BE AWAY FROM THIS SHIP FOR A MOMENT...',
                cb: function () {
                  dialogPush({
                    custom_render: nameRender(name),
                    text: 'Blast it.  You know I can\'t leave my post.',
                    buttons: [{
                      label: 'AND YOU CAN\'T BE EMPTY-HANDED FOR YOUR ANNIVERSARY...',
                      cb: function () {
                        consumeItem('key1');
                        dialogPush({
                          custom_render: nameRender(name),
                          text: 'Ugh, this is exactly what I need...',
                          buttons: [{
                            label: 'COME ON, NO MONEY.  JUST WALK AWAY.',
                            cb: function () {
                              keySet('solvedguard');
                              killEntOnFloor('enemyT4');
                              signWithName(name, 'Fine.  Deal.');
                            },
                          }],
                        });
                      },
                    }],
                  });
                },
              }],
            });
          },
        }, {
          label: 'I WAS JUST LEAVING...',
        }]
      });
    }
    if (!keyGet('metguard')) {
      keySet('metguard');
      return signWithName(name, 'You\'re not authorized to be in here.');
    }
    return signWithName(name, 'I told you to leave!');
  },
  killedguard: function () {
    keySet('solvedguard');
    keySet('killedguard');
    signWithName('MONOLOGUING', 'Well, I guess that takes care of that...');
  },
});

dialogIconsRegister({
  finalsafe: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return null; // has treasure instead from entity 'icon_exclamation';
  },
});
let did_safe_this_session = false;
export function didSafeThisSession(): boolean {
  return did_safe_this_session;
}
export function clearSafeThisSession(): void {
  did_safe_this_session = false;
}
dialogRegister({
  finalsafe: function () {
    if (hasItem('key6')) {
      did_safe_this_session = true;
      return;
    }
    if (!keyGet('solvedsafe')) {
      return signWithName('MONOLOGUING', 'Locked, of course.  And there\'s no way I\'ll be able to blast things thing open.  Surely someone here knows **THE SAFE COMBINATION**.');
    }
    if (!keyGet('solvedescape')) {
      return signWithName('MONOLOGUING', 'I need a plan of escape before I take this and set off the alarm...');
    }
    did_safe_this_session = true;
    playUISound('gain_item_loot');
    giveReward({ items: [{ item_id: 'key6' }] });
    let api = crawlerScriptAPI();
    let ents = entitiesAt(entityManager(), api.pos, api.getFloor(), true);
    ents = ents.filter((ent) => {
      return ent.is_chest;
    });
    if (ents.length) {
      entityManager().deleteEntity(ents[0].id, 'looted');
    }

    return signWithName('MONOLOGUING', 'My prize is in hand, but that alarm is getting on my nerves.  Time to blow this joint.');
  },
});

dialogIconsRegister({
  soldier: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (keyGet('soldierdrunk') || keyGet('solvedguard') || !keyGet('metguard')) {
      return null;
    }
    return 'icon_exclamation';
  },
});
dialogRegister({
  soldier: function () {
    let name = 'THE OFF-DUTY SOLDIER';
    if (keyGet('killedguard')) {
      return signWithName(name, 'I\'m really gonna miss that guy...');
    }
    if (!keyGet('metguard')) {
      return signWithName(name, 'I\'m so lucky to be on **THE ASCENDING SWORD**, my boss is always working so I don\'t have to...');
    }
    if (!keyGet('solvedguard')) {
      if (keyGet('soldierdrunk')) {
        return signWithName(name, "**THE ESTRANGED GUARD** wants **THE DAZZLING GIFT** his wife, that's all you'll get from me.");
      }
      return dialogPush({
        custom_render: nameRender(name),
        text: 'Whatcha want, kid?',
        buttons: [{
          label: 'JUST SOME INFO ABOUT YOUR BOSS ON **THE SWORD**',
          cb: function () {
            dialogPush({
              custom_render: nameRender(name),
              text: "Kid, I'm off the clock.  And if you think that I'm gonna give you any info about my work, you're either crazy or stupid.",
              buttons: [{
                label: `BUY HIM A DRINK ([img=icon-currency]${DRINK_COST})`,
                cb: 'soldierbuydrink',
              }, {
                label: 'MAYBE LATER...',
                cb: function () {
                  signWithName(name, 'Scram, kid.');
                }
              }],
            });
          },
        }],
      });
    }
    return signWithName(name, 'I\'m so lucky to be on **THE ASCENDING SWORD**, my boss is always working so I don\'t have to...');
  },
  soldierbuydrink: function () {
    let name = 'THE OFF-DUTY SOLDIER';
    if (myEnt().data.money < DRINK_COST) {
      return signWithName(name, 'Hah, you can\'t even afford a drink?  Scram, kid.');
    }
    consumeMoney(DRINK_COST, false);

    let list = [
      ['soldierdrink1', '...Stars, this stuff ain\'t bad.'],
      ['soldierdrink2', "I could've been something. But I had to go into the force."],
      ['soldierdrink3', 'Being an explorer must be fun. No rules, make your own schedule.'],
    ];
    let did_set = false;
    for (let ii = 0; ii < list.length; ++ii) {
      let elem = list[ii];
      if (!keyGet(elem[0])) {
        if (!did_set) {
          keySet(elem[0]);
          did_set = true;
        } else {
          return dialogPush({
            custom_render: nameRender(name),
            text: elem[1],
            buttons: [{
              label: `LET'S GET YOU ANOTHER ([img=icon-currency]${DRINK_COST})`,
              cb: 'soldierbuydrink',
            }, {
              label: 'MAYBE LATER...',
              cb: function () {
                signWithName(name, 'Thanks for the drink, kid.');
              }
            }],
          });
        }
      }
    }
    dialogPush({
      custom_render: nameRender(name),
      text: '*hiccup*',
      buttons: [{
        label: 'NOW, CAN YOU TELL ME ABOUT **THE ESTRANGED GUARD**?',
        cb: function () {
          dialogPush({
            custom_render: nameRender(name),
            text: 'Alright, **THE ESTRANGED GUARD** is looking for **THE DAZZLING GIFT** for his wife for their anniversary.  He\'d do anything to get her something real pretty.',
            buttons: [{
              label: 'THANKS',
              cb: function () {
                keySet('soldierdrunk');
              },
            }],
          });
        },
      }],
    });
  },
});

dialogIconsRegister({
  captain: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (!keyGet('metguard') || !keyGet('foundship') || keyGet('solvedescape')) {
      return null;
    }
    if (myEnt().data.money >= COST_ESCAPE) {
      return 'icon_exclamation';
    }
    return 'icon_question';
  },
});
dialogRegister({
  captain: function () {
    const name = 'THE SHADY CAPTAIN';
    if (keyGet('solvedescape') && hasItem('key5')) {
      return signWithName(name, 'Me and my crew are ready to leave any time.  Meet us in **Bay 47** when you need to leave.');
    }
    if (!keyGet('metguard') || !keyGet('foundship') || keyGet('solvedescape')) {
      return signWithName(name, 'Let me tell you about how we fought against THE NEW ALLIANCE in the last war...');
    }
    if (!keyGet('metcaptain')) {
      keySet('metcaptain');
      return dialogPush({
        custom_render: nameRender(name),
        text: 'How\'s it going?',
        buttons: [{
          label: 'SHINY.  I NEED A FAVOR.',
          cb: function () {
            dialogPush({
              custom_render: nameRender(name),
              text: '30% cut as usual.',
              buttons: [{
                label: '30% SEEMS TOTALLY FAIR, HOWEVER THIS ONE\'S COMPLICATED...',
                cb: function () {
                  dialogPush({
                    custom_render: nameRender(name),
                    text: 'Just keep my name out of it.',
                    buttons: [{
                      label: 'HOW MUCH WILL IT COST ME?',
                      cb: 'captain',
                    }],
                  });
                },
              }],
            });
          },
        }],
      });
    }
    if (myEnt().data.money < COST_ESCAPE) {
      return signWithName(name, `Need some off-the-books transit outta here?  It'll cost you [img=icon-currency]${COST_ESCAPE}.`);
    }
    dialogPush({
      custom_render: nameRender(name),
      text: `Need some off-the-books transit outta here?  It'll cost you [img=icon-currency]${COST_ESCAPE}.`,
      buttons: [{
        label: `HERE YOU GO ([img=icon-currency]${COST_ESCAPE})`,
        cb: function () {
          consumeMoney(COST_ESCAPE, false);
          keySet('solvedescape');
          playUISound('gain_item_quest');
          giveReward({ items: [{ item_id: 'key5' }] });
          dialog('captain');
        },
      }, {
        label: 'I\'LL BE BACK...',
      }]
    });
  },
});

dialogRegister({
  escape: function () {
    const name = 'THE BEHATTED MERCENARY';
    if (!hasItem('key5')) {
      return signWithName(name, 'Hey, get off our boat.');
    }
    if (!hasItem('key6')) {
      return signWithName(name, 'Come back here when you\'re ready to leave in a hurry.');
    }
    myEnt().data.score_won = 1;
    setScore();
    autosave();
    dialogPush({
      custom_render: nameRender(name),
      text: 'That\'s a lot of commotion back there... Ready to go?',
      buttons: [{
        label: 'TAKE ME OUT INTO THE BLACK, WHERE NO ONE CAN FOLLOW...',
        cb: function () {
          dialogPush({
            text: 'CONGRATULATIONS!  You have accomplished your daring heist (and have won this game).',
            buttons: [{
              label: 'I ALSO PREVENTED **THE RED DEVASTATION** FROM BEING USED FOR EVIL.',
              cb: 'thanksforplaying',
            }, {
              label: 'NAH, I JUST SOLD **THE RED DEVASTATION** TO THE HIGHEST BIDDER.',
              cb: 'thanksforplaying',
            }]
          });
        },
      }]
    });
  },
  thanksforplaying: function () {
    dialogPush({
      text: 'Good choice.  THANKS FOR PLAYING!',
      buttons: [{
        label: 'YOU\'RE WELCOME',
        cb: function () {
          queueTransition();
          creditsGo();
        },
      }]
    });
  }
});

// dialogIconsRegister({
//   student: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
//     if (keyGet('sovledsafe') || hasItem('key4') || keyGet('metassist')) {
//       return null;
//     }
//     if (!keyGet('metstudent')) {
//       return 'icon_exclamation';
//     }
//     return null;
//   },
// });
// dialogRegister({
//   student: function () {
//     const name = 'THE STRUGGLING STUDENT';
//     if (keyGet('metstudent')) {
//       return signWithName(name, 'My professor should be around here somewhere...');
//     }
//     keySet('metstudent');
//     dialogPush({
//       custom_render: nameRender(name),
//       text: "One of my professors has a research obligation with the military.  She's really nice, I wish I could take more of her classes.  She said she'd be on this station today for work...",
//       buttons: [{
//         label: 'WORKS WITH THE MILITARY, EH...',
//       }],
//     });
//   },
// });

dialogIconsRegister({
  hint1: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (!keyGet('assist2') || hasItem('key3') || keyGet('solvedsafe')) {
      return null;
    }
    if (!keyGet('hint1')) {
      return 'icon_exclamation';
    }
    return 'icon_question';
  }
});
dialogRegister({
  hint1: function () {
    let name = 'THE AGED AI';
    if (!keyGet('assist2') || hasItem('key3') || keyGet('solvedsafe')) {
      return signWithName(name, 'My data banks may be outdated, but I once knew all of the interesting tourist spots!');
    }
    if (!keyGet('hint1')) {
      keySet('hint1');
      return dialogPush({
        custom_render: nameRender(name),
        text: 'Ooh, I know what you would like!\n\nYou should visit **EPSILON-ALPHA**, the best place to see unique, one-of-a-kind artifacts.\n\nPlease note, due to security problems, tourism there is currently prohibited.',
        buttons: [{
          label: 'HMM, MAYBE I CAN FIND **THE TICKET TO PARADISE** THERE...',
        }],
      });
    }
    signWithName('MONOLOGUING', '**EPSILON-ALPHA** is where I should look for **THE TICKET TO PARADISE**');
  },
});


dialogIconsRegister({
  observation: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    let { data } = myEnt();
    if (keyGet('sovledsafe') || hasItem('key4')) {
      return null;
    }
    if (!keyGet('foundship') || !keyGet('solvedguard')) {
      return null;
    }
    if (!keyGet('assist1')) {
      if (!keyGet('assistintro')) {
        return 'icon_exclamation';
      }
      if (data.money < COST_ASSIST_BRIBE) {
        return null;
      }
      return 'icon_exclamation';
    }
    if (!keyGet('assist2')) {
      return 'icon_exclamation';
    }
    if (hasItem('key3')) {
      return 'icon_exclamation';
    }
    return 'icon_question';
  },
  assistant: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    let { data } = myEnt();
    if (keyGet('sovledsafe') || hasItem('key4')) {
      return null;
    }
    if (!keyGet('foundship') || !keyGet('solvedguard')) {
      return null;
    }
    if (!keyGet('assist1')) {
      if (!keyGet('assistintro')) {
        return 'icon_exclamation';
      }
      if (data.money < COST_ASSIST_BRIBE) {
        return 'icon_question';
      }
      return 'icon_exclamation';
    }
    if (!keyGet('assist2')) {
      return 'icon_exclamation';
    }
    if (hasItem('key3')) {
      return 'icon_exclamation';
    }
    return 'icon_question';
  },
});
dialogRegister({
  observation: function () {
    // nothing
  },
  assistant: function () {
    const name = 'THE BELEAGUERED ASSISTANT';
    let { data } = myEnt();
    if (keyGet('sovledsafe') || hasItem('key4')) {
      return;
    }
    if (!keyGet('foundship')) {
      return signWithName(name, 'Why am I wasting my time in this port?');
    }
    if (!keyGet('assist1')) {
      if (!keyGet('assistintro')) {
        return dialogPush({
          custom_render: nameRender(name),
          text: "Don't tell me you're here to complain about one of the officers...",
          buttons: [{
            label: "NO, I'M HERE TO TALK TO YOU.",
            cb: function () {
              keySet('assistintro');
              dialogPush({
                custom_render: nameRender(name),
                text: 'About...?',
                buttons: [{
                  label: "I HEAR YOU'RE WITH THE SHIP IN **#82**.  DO YOU KNOW ANYTHING ABOUT THE SAFE?",
                  cb: 'assistant',
                }],
              });
            },
          }]
        });
      }
      if (data.money < COST_ASSIST_BRIBE) {
        return signWithName(name, `Assistants don't get paid very well, you know... (come back with [img=icon-currency]${COST_ASSIST_BRIBE})`);
      }
      return dialogPush({
        custom_render: nameRender(name),
        text: "About that... assistants don't get paid very well, you know...",
        buttons: [{
          label: `HOW'S [img=icon-currency]${COST_ASSIST_BRIBE} SOUND?`,
          cb: function () {
            consumeMoney(COST_ASSIST_BRIBE, false);
            keySet('assist1');
            dialog('assistant');
          },
        }, {
          label: 'MAYBE LATER...',
        }],
      });
    }
    if (!keyGet('assist2')) {
      keySet('assist2');
      return dialogPush({
        custom_render: nameRender(name),
        text: "Now, if I tell you anything, the heat is going to be **on**, so I'm going to have to live my life far away from here, preferably in paradise...",
        buttons: [{
          label: "I'LL SEE WHAT I CAN DO...",
          cb: function () {
            if (hasItem('key3')) {
              dialog('assistant');
            }
          },
        }]
      });
    }
    if (hasItem('key3')) {
      return dialogPush({
        custom_render: nameRender(name),
        text: 'Is that **THE TICKET TO PARADISE**?',
        buttons: [{
          label: "IT'S YOURS, FOR **THE SAFE COMBINATION**.",
          cb: function () {
            consumeItem('key3');
            playUISound('gain_item_quest');
            giveReward({ items: [{ item_id: 'key4' }] });
            keySet('solvedsafe');
            signWithName(name, 'Deal.  I\'m outta here.');
            killEntWhereIStand('npc05');
          },
        }],
      });
    }
    return signWithName(name, 'I\'m going to need to live my life far way from here, preferably in paradise...');
  },
});

dialogIconsRegister({
  bay82: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (keyGet('foundship')) {
      if (!hasItem('key6') && keyGet('solvedguard') && keyGet('solvedsafe') && keyGet('solvedescape')) {
        return 'icon_exclamation';
      }
      return 'icon_question';
    }
    return null;
  },
  bay47: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (keyGet('solvedescape')) {
      if (hasItem('key6')) {
        return 'icon_exclamation';
      }
      return 'icon_question';
    }
    return null;
  },
});
dialogRegister({
  bay82: () => {
    // nothing
  },
  bay47: () => {
    // nothing
  },
  bay47outer: () => {
    if (keyGet('solvedescape')) {
      dialog('sign', 'BAY #47');
    }
  },
  bay82outer: () => {
    if (keyGet('foundship')) {
      dialog('sign', 'BAY #82');
    }
  },
});


dialogIconsRegister({
  tips: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (!keyGet('rumor1')) {
      return 'icon_exclamation';
    }
    if (!keyGet('lookedforship')) {
      return 'icon_question';
    }
    if (keyGet('soldierdrunk') && !hasItem('key1') && !keyGet('solvedguard')) {
      if (keyGet('hint2')) {
        return 'icon_question';
      }
      return 'icon_exclamation';
    }

    if (keyGet('foundship') &&
      keyGet('solvedguard') &&
      !hasItem('key3') &&
      !(keyGet('sovledsafe') || hasItem('key4'))
    ) {
      if (!keyGet('assist1')) {
        if (!keyGet('assistintro') && !keyGet('hint3')) {
          return 'icon_exclamation';
        }
        return 'icon_question';
      }
    }

    return null;
  },
});
dialogRegister({
  tips: function () {
    let name = 'THE FLIRTY ENGINEER';
    if (!keyGet('rumor1')) {
      keySet('rumor1');
      return dialogPush({
        custom_render: nameRender(name),
        text: 'I heard that **THE ASCENDING SWORD** is transporting **THE RED DEVASTATION** through the station today.',
        buttons: [{
          label: 'THAT SEEMS LIKE SOMETHING SAFEST IN *MY* HANDS...'
        }],
      });
    }
    if (!keyGet('lookedforship') && !keyGet('foundship')) {
      return signWithName(name, 'Go check out the dock for **THE ASCENDING SWORD**.');
    }

    if (keyGet('soldierdrunk') && !hasItem('key1') && !keyGet('solvedguard')) {
      if (keyGet('hint2')) {
        return signWithName(name, "Wouldn't it just be *amazing* to have **THE DAZZLING GIFT** found on **ATLAS-7**?");
      }
      keySet('hint2');
      return dialogPush({
        custom_render: nameRender(name),
        text: "I heard someone say they saw **THE DAZZLING GIFT** deep in the caves on **ATLAS-7**.  Wouldn't it just be *amazing* to own that?",
        buttons: [{
          label: 'NOT MY TASTE, BUT I MIGHT KNOW A DOLL...'
        }],
      });
    }

    if (keyGet('foundship') &&
      keyGet('solvedguard') &&
      !hasItem('key3') &&
      !(keyGet('sovledsafe') || hasItem('key4'))
    ) {
      if (!keyGet('assist1')) {
        // haven't yet done the bribe
        if (!keyGet('hint3')) {
          keySet('hint3');
          return dialogPush({
            custom_render: nameRender(name),
            text: 'I heard **THE BELEAGUERED ASSISTANT** talking to herself up in **THE OBSERVATION DECK**, something about being worried she was going to misplace **THE SAFE COMBINATION**.',
            buttons: [{
              label: 'THAT WOULD BE A SHAME...'
            }],
          });
        }
        return signWithName(name, '**THE BELEAGUERED ASSISTANT** up in **THE OBSERVATION DECK** might have **THE SAFE COMBINATION** you need.');
      }
    }

    return signWithName(name, 'Whatever you\'re looking for, someone in this place can probably help you.');
    // any other tips?
  },
});

dialogIconsRegister({
  dockingwander: () => {
    return keyGet('rumor1') && !keyGet('lookedforship') && !keyGet('foundship') ? 'icon_exclamation' : null;
  },
});
dialogRegister({
  dockingwander: function () {
    if (!keyGet('foundship')) {
      if (!keyGet('rumor1')) {
        signWithName('MONOLOGUING', 'What am I doing wandering the hangars?  I bet someone in the **CANTINA** knows about something worth my time.', true);
      } else {
        signWithName('MONOLOGUING', 'Searching one-by-one will take forever.  Maybe one of the **shiptakers** knows where **THE ASCENDING SWORD** is.', true);
        keySet('lookedforship');
      }
    }
  },
});

dialogIconsRegister({
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
    return 'icon_question';
  },
  oldracer: () => {
    if (keyGet('lookingforship') && !keyGet('racerdied')) {
      return 'icon_exclamation';
    }
    return null;
  },
});
dialogRegister({
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
      return dialogPush({
        custom_render: nameRender(name),
        text: 'You\'ve done it, **THE GOLDEN ROCKET**!',
        buttons: [{
          label: 'YOU CAN KEEP IT, THE WINNER DOESN\'T NEED IT ANYMORE',
          cb: function () {
            consumeItem('key2');
            dialogPush({
              custom_render: nameRender(name),
              text: 'Pops is gonna be ecstatic!  You did good, kid.  You want to know about **THE ASCENDING SWORD**? It\'s in Bay **#82**.',
              buttons: [{
                label: 'GLAD I COULD HELP...',
              }],
            });
          },
        }],
      });
    }
    if (!keyGet('lookingforship')) {
      return dialogPush({
        custom_render: nameRender(name),
        text: 'I know every ship that docks or departs this station.',
        buttons: [{
          label: `BUY HIM A DRINK ([img=icon-currency]${DRINK_COST})`,
          cb: function () {
            if (myEnt().data.money < DRINK_COST) {
              return signWithName(name, 'Hah, you can\'t even afford a drink?  Well, you know where to find me if you want to learn anything about ships.');
            }
            keySet('lookingforship');
            consumeMoney(DRINK_COST, false);

            dialogPush({
              custom_render: nameRender(name),
              text: "Ah, thank you.  You know, I come from a long line of pilots.  When I was younger, my Pops entered into the '86 piloting race on B-23, but he didn't win.  He's always wanted to hold the trophy for the race, **THE GOLDEN ROCKET**, even just for a moment.  After all these years, it's still his dream.  The guy who beat him should still be alive...",
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
  oldracer: function () {
    if (keyGet('racerdied')) {
      return;
    }
    dialogPush({
      custom_render: nameRender('THE OLD RACER'),
      text: 'Oh, my, a visitor, why I haven\'t had a visitor in years. To what do I... I...',
      buttons: [{
        label: 'SIR... ?',
        cb: function () {
          killEntWhereIStand('npc08');
          keySet('racerdied');
          signWithName('MONOLOGUING', 'Huh, it appears his heart couldn\'t take the shock...');
        },
      }],
    });
  },
});

dialogRegister({
  outsideracer: function () {
    if (!keyGet('lookingforship')) {
      signWithName('MONOLOGUING', 'Hmm, it seems no one\'s home...');
    }
  },
});

dialogIconsRegister({
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
  historian: function () {
    let name = 'THE WANDERING HISTORIAN';
    if (keyGet('lookingforship') && !keyGet('foundship')) {
      if (!keyGet('historian')) {
        keySet('historian');
        return dialogPush({
          custom_render: nameRender(name),
          text: '**THE GOLDEN ROCKET**? Yes, it\'s a very sought-after trophy. The \'86 winner retired a handful of years ago to Zarenth, a town on **Calliope**.',
          buttons: [{
            label: 'THAT\'S REALLY INTERESTING...',
          }],
        });
      }
      return signWithName(name, '**THE GOLDEN ROCKET**? The \'86 winner retired to **Calliope**.');
    }
    signWithName(name, 'This area of space has some really interesting creatures...');
  },
});

dialogIconsRegister({
  hats: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    let { next, hat_cost } = nextHatCost();
    if (!next) {
      return null;
    }
    return myEnt().data.money >= hat_cost ? 'icon_exclamation' : 'icon_question';
  },
});
dialogRegister({
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
});

dialogRegister({
  bayguard1: function () {
    signWithName('THE TRUSTING DOCKMAN', "You don't look the type that would poke in other people's ships, right?");
  },
  bayguard2: function () {
    signWithName('THE LAZY DOCKMAN', "You look like you're the type to poke in other people's ships, but... please don't.");
  },
});

dialogIconsRegister({
  medbay: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_shop1';
  },
});
dialogRegister({
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
        label: `YES, PLEASE! ([img=icon-currency]${COST_MEDKIT})`,
        cb: 'medbuy',
      }, {
        label: 'MAYBE LATER...',
      }]
    });
  },
  medbuy: function () {
    let { data } = myEnt();
    data.money -= COST_MEDKIT;
    data.score_money -= COST_MEDKIT;
    playUISound('gain_item_purchase');
    giveReward({ items: [{ item_id: 'med1' }] });
    if (data.money < COST_MEDKIT) {
      return signWithName('THE UNDERPAID NURSE', 'Thank you, come again!');
    }
    dialogPush({
      custom_render: nameRender('THE UNDERPAID NURSE'),
      text: `There you go!  Want another?\n${numMedkitsMessage()}`,
      buttons: [{
        label: `THANK YOU SIR, MAY I HAVE ANOTHER! ([img=icon-currency]${COST_MEDKIT})`,
        cb: 'medbuy',
      }, {
        label: 'THAT\'LL BE ALL, THANKS...',
      }]
    });
  },
});

dialogIconsRegister({
  shuttle: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_shop2';
  },
});
dialogRegister({
  shuttle: function () {
    let name = 'THE COMPASSIONATE CLERK';
    if (!keyGet('rumor1')) {
      return signWithName('MONOLOGUING', 'I don\'t think I should leave the station just yet.');
    }
    if (!hasItem('helmetfree')) {
      return signWithName('MONOLOGUING', 'I don\'t feel properly equipped to leave just yet.');
    }
    if (keyGet('shuttlekey')) {
      return signWithName(name, 'Just take that door behind you to the shuttle bay.');
    }
    let me = myEnt();
    let { money } = me.data;
    dialogPush({
      custom_render: nameRender(name),
      name: '',
      text: money >= SHUTTLE_COST ? `Shuttle rentals are [img=icon-currency]${SHUTTLE_COST}.  Watch out for pirates.` : `New around here, eh?  The shuttle normally costs [img=icon-currency]${SHUTTLE_COST}, but you look a little down on your luck, so just this once I'll rent you one for free.  Watch out for pirates, and don't crash my shuttle!`,
      buttons: [{
        label: 'OK, I\'LL TAKE ONE',
        cb: function () {
          if (me.data.money >= SHUTTLE_COST) {
            me.data.money -= SHUTTLE_COST;
            me.data.score_money -= SHUTTLE_COST;
          }
          keySet('shuttlekey');
          dialog('shuttle');
        },
      }, {
        label: 'MAYBE ANOTHER TIME...',
      }],
    });
  },
});

dialogIconsRegister({
  traveloutside: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (keyGet('shuttlekey')) {
      return 'icon_exclamation';
    }
    return null;
  },
});
dialogRegister({
  traveloutside: function () {
    // nothing
  },
});

// generic / non-iconic
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
  onetime: function (param: string) {
    if (onetimeEvent()) {
      signWithName('', param, true);
    }
  },
  kbhintonetime: function (param: string) {
    if (!inputTouchMode() && onetimeEvent()) {
      dialogPush({
        name: '',
        text: param,
        transient: true,
      });
    }
  },
  othership: function (param: string) {
    signWithName('MONOLOGUING', "Hmm, this ship's locked up tight, no getting in there, even at my best.");
  },
  mono: function (param: string) {
    if (onetimeEvent()) {
      signWithName('MONOLOGUING', param, true);
    }
  },
  travelfail: function () {
    let me = myEnt();
    let { money } = me.data;
    let take = money > LOSE_COST;
    if (take) {
      me.data.money -= LOSE_COST;
      consumeMoney(LOSE_COST, true);
    }
    dialogPush({
      name: '',
      text: 'YOU\'VE CRASHED THE SHUTTLE.\n' +
        (take ? `I guess you've gotta pay for repairs... you're out [img=icon-currency]${LOSE_COST}, but you're alive.` :
        'Since you lack the cash on hand, the rental company says they\'ll take it up with your insurance.'),
      buttons: [{
        label: 'OK',
        cb: function () {
          travelGameFinish();
        },
      }],
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
  debug: function (param: string) {
    let max_tier = 0;
    if (param[0] === 't') {
      max_tier = Number(param.slice(1));
    }
    let { inventory } = myEnt().data;
    for (let key in ITEMS) {
      let has = false;
      for (let ii = 0; ii < inventory.length; ++ii) {
        if (inventory[ii].item_id === key) {
          has = true;
        }
      }
      if (!has) {
        let item = {
          item_id: key,
        };
        if (max_tier) {
          let tier = itemTier(item);
          if (tier !== max_tier) {
            continue;
          }
        }
        inventory.push(item);
      }
    }
    giveReward({ items: [{ item_id: 'med1', count: 3 }] });
    if (!max_tier) {
      myEnt().data.money = 9999;

      keySet('rumor1');
      keySet('foundship');
      keySet('solvedguard');
      keySet('metguard');
      keySet('solvedsafe');
      keySet('solvedescape');

      dialog('sign', 'GRANTED EVERYTHING');
    } else {
      dialog('sign', `GRANTED T${max_tier} GEAR`);
    }
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

cmd_parse.register({
  help: 'Give an item',
  prefix_usage_with_help: true,
  usage: `Usage: /give ID  or  /give money 1000\n\nITEM IDs: ${Object.keys(ITEMS).join(', ')}`,
  cmd: 'give',
  func: function (param, resp_func) {
    let m = param.match(/money (\d+)/);
    if (m) {
      return giveReward({ money: Number(m[1]) });
    }
    if (!ITEMS[param]) {
      return resp_func('Invalid ITEM ID');
    }
    giveReward({ items: [{ item_id: param }] });
  },
});

cmd_parse.register({
  cmd: 'status',
  func: function (param, resp_func) {
    statusPush(param);
  },
});
