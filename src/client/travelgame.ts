/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from 'assert';
import { autoAtlas } from 'glov/client/autoatlas';
import { MODE_DEVELOPMENT } from 'glov/client/client_config';
import { getFrameDt } from 'glov/client/engine';
import { ALIGN, FontStyle, fontStyleColored } from 'glov/client/font';
import { keyDown, keyDownEdge, KEYS } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { spot, SPOT_DEFAULT_BUTTON } from 'glov/client/spot';
import { buttonText, drawLine, panel, playUISound, uiButtonHeight, uiGetFont, uiTextHeight } from 'glov/client/ui';
import { randCreate, shuffleArray } from 'glov/common/rand_alea';
import { clamp, easeInOut, lerp, plural, ridx } from 'glov/common/util';
import { crawlerEntityManager } from './crawler_entity_client';
import { crawlerController, crawlerGameState } from './crawler_play';
import { dialog } from './dialog_system';
import { game_height, HUD_PAD, HUD_W, HUD_X0, HUD_Y0, render_width, VIEWPORT_X0 } from './globals';
import { tickLoopingSound } from './music';
import { drawHealthBar, drawHUDPanel, myEnt, queueTransition } from './play';

export const HAND_SIZE = 6;
export const MAX_HEAT = 7;

const { max, min, PI } = Math;

const RULES = `Rules:
  Play your current **Gear** -1/+0/+1
     **SPEED** cards to set new Gear.
  Exceeding **Safe Speed** generates
     **Heat** and puts **COOLANT**
     cards into your deck.
  **Gear** 1/2 automatically uses 3/1
     **COOLANT** at end of turn, if
     they're in your hand.
` +
`  Don't overheat and crash.
  Get through all asteroids to
     safety.`;
// `  Don't overheat and crash or let
//      THE PURSUER catch you.
//   Get through all asteroids to
//      safety or outrun your pursuer`;

type Asteroid = {
  pos: number;
  max_speed: number;
  goal: boolean;
};

let rand = randCreate(Date.now());

type AsteroidEvent = {
  pos: number;
  event: number;
};
type LastMove = {
  start_pos: number;
  end_pos: number;
  speed: number;
  cooling: number;
  hand: number[];
  heat: number;
  asteroid_events: AsteroidEvent[];
};

let destination_floor = 10;
let destination_key = 'stairs_out';
export function travelTo(floor_id: number, special_pos: string): void {
  destination_floor = floor_id;
  destination_key = special_pos;
  crawlerController().goToFloor(7);
}

class TravelGameState {
  pos = 0;
  gear = 1;
  heat = 0;
  asteroids: Asteroid[];
  deck: number[];
  hand: number[];
  discard: number[];
  selected: boolean[];
  log: string[] = [];
  done = false;
  won = false;
  animating = false;
  transitioning = false;
  t = 0;
  constructor() {
    let entity_manager = crawlerEntityManager();
    let game_state = crawlerGameState();
    let { floor_id } = game_state;
    let { entities } = entity_manager;
    for (let entity_id in entities) {
      let ent = entities[entity_id]!;
      if (ent.data.floor === floor_id && ent.type_id === 'asteroid_danger') {
        entity_manager.deleteEntity(ent.id, 'reset');
      }
    }

    this.asteroids = [];
    this.deck = [];
    this.discard = [];
    this.hand = [];
    this.selected = [];
    let { asteroids, deck } = this;
    let adist = 0;
    function apush(dist: number, max_speed: number): void {
      adist += dist;
      asteroids.push({
        pos: adist,
        max_speed,
        goal: max_speed === -1,
      });
      if (max_speed !== -1) {
        entity_manager.addEntityFromSerialized({
          type: 'asteroid_danger',
          floor: floor_id,
          pos: [adist - 1, 2, 0],
        });
      }
    }
    // USA map
    apush(12, 7);
    apush(21, 3);
    apush(16, 3);
    apush(8, 2);
    // apush(24, 7);
    // apush(12, 7);
    // apush(21, 3);
    // apush(16, 3);
    // apush(8, 2);
    apush(18, -1);

    for (let ii = 1; ii <= 4; ++ii) {
      for (let jj = 0; jj < 3; ++jj) {
        deck.push(ii);
      }
    }
    shuffleArray(rand, deck);
    this.log.push('THE PURSUER is after me.  It\'ll get messy if they catch me,' +
      ' let\'s dodge through this asteroid field to lose them.');
    this.draw();
  }

  draw(): void {
    let { deck, hand, discard } = this;
    let new_cards: string[] = [];
    this.log.push('');
    while (hand.length < HAND_SIZE) {
      if (!deck.length) {
        while (discard.length) {
          deck.push(discard.pop()!);
        }
        this.log.push(`Reshuffled (${deck.length} cards)`);
        shuffleArray(rand, deck);
      }
      let new_card = deck.pop()!;
      if (new_card === -1) {
        new_cards.push('COOLANT');
      } else {
        new_cards.push(`SPEED ${new_card}`);
      }
      hand.push(new_card);
    }
    hand.sort();
    new_cards.sort();
    this.log.push(`Drew: ${new_cards.join(', ')}`);
  }

  numSelected(): number {
    let selected_count = 0;
    for (let ii = 0; ii < this.selected.length; ++ii) {
      if (this.selected[ii]) {
        ++selected_count;
      }
    }
    return selected_count;
  }

  allSpeedSelected(): boolean {
    for (let ii = 0; ii < this.hand.length; ++ii) {
      if (this.hand[ii] !== -1 && !this.selected[ii]) {
        return false;
      }
    }
    return true;
  }

  canGo(): boolean {
    let selected_count = this.numSelected();
    let can_go = selected_count >= this.gear - 1 && selected_count <= this.gear + 1 &&
      selected_count >= 1 && selected_count <= 4;
    return can_go || this.allSpeedSelected();
  }

  speed(): number {
    let ret = 0;
    for (let ii = 0; ii < this.selected.length; ++ii) {
      if (this.selected[ii]) {
        ret += this.hand[ii];
      }
    }
    return ret;
  }
  predCooling(): number {
    let selected_count = this.numSelected();
    return selected_count === 1 ? 3 : selected_count === 2 ? 1 : 0;
  }

  logAsteroid(idx: number, log: string[]): void {
    let next = this.asteroids[idx];
    if (!next) {
      return;
    }
    if (next.goal) {
      log.push('**SAFETY** is in sight.');
    } else {
      log.push('', '! ASTEROID collision imminent !', `  Maximum Safe Speed: ${next.max_speed}`);
    }
    log.push(`  Distance: ${next.pos - this.pos}`);
  }

  willOverheat(): null | [number, number, number] {
    let speed = this.speed();
    let selected_count = this.numSelected();
    let cooling = this.predCooling();
    let eff_cooling = 0;
    let { discard, hand, selected, heat } = this;
    for (let ii = hand.length - 1; ii >= 0; --ii) {
      if (cooling && hand[ii] === -1) {
        heat--;
        cooling--;
        ++eff_cooling;
      }
    }
    let end_pos = this.pos + speed;
    let dheat = 0;
    let ast_idx = 0;
    let lowest_speed = Infinity;
    while (this.asteroids[ast_idx].pos <= end_pos) {
      let asteroid = this.asteroids[ast_idx];
      if (asteroid.goal) {
        break;
      } else if (speed > asteroid.max_speed) {
        lowest_speed = min(lowest_speed, asteroid.max_speed);
        dheat += speed - asteroid.max_speed;
      }
      ++ast_idx;
    }
    if (!dheat) {
      return null;
    }
    let over = max(0, heat + dheat - MAX_HEAT);
    return [dheat, over, lowest_speed];
  }

  last_move: LastMove | null = null;

  go(): void {
    let speed = this.speed();
    let selected_count = this.numSelected();
    let cooling = this.predCooling();
    let eff_cooling = 0;
    let { discard, hand, selected, log } = this;
    log.length = 0;
    log.push('**EXECUTE MANEUVER**','');
    if (selected_count !== this.gear) {
      log.push(`Changed to **Gear ${selected_count}**.`);
    }

    let last_move_hand: number[] = hand.slice(0);

    log.push(`Played ${selected_count} **SPEED** ${plural(selected_count, 'card')} for **${speed} speed**.`);
    for (let ii = hand.length - 1; ii >= 0; --ii) {
      if (selected[ii]) {
        last_move_hand[ii] = -2;
        discard.push(hand[ii]);
        selected[ii] = false;
        ridx(hand, ii);
      } else if (cooling && hand[ii] === -1) {
        last_move_hand[ii] = -3;
        this.heat--;
        cooling--;
        ++eff_cooling;
        ridx(hand, ii);
      }
    }
    if (selected_count !== this.gear) {
      if (selected_count > this.gear) {
        playUISound(`ship_accelerate_${selected_count}`);
      } else {
        playUISound(`ship_decelerate_${selected_count}`);
      }
      this.gear = selected_count;
    } else {
      playUISound('ship_maintain_speed');
    }
    if (eff_cooling) {
      log.push(`Played **${eff_cooling} COOLANT** ${plural(eff_cooling, 'card')}, reducing heat to ${this.heat}.`);
    }
    let start_pos = this.pos;
    let end_pos = this.pos + speed;
    let dheat = 0;
    let win = false;
    let asteroid_events: AsteroidEvent[] = [];
    while (this.asteroids[0].pos <= end_pos) {
      let asteroid = this.asteroids.shift()!;
      if (asteroid.goal) {
        win = true;
        break;
      } else if (speed > asteroid.max_speed) {
        dheat += speed - asteroid.max_speed;
        log.push(`Generated **${dheat} Heat** avoiding ASTEROID (speed` +
          ` ${speed} above Safe Speed of ${asteroid.max_speed})`);
        asteroid_events.push({
          pos: asteroid.pos,
          event: 1,
        });
        if (this.heat + dheat > MAX_HEAT) {
          end_pos = asteroid.pos - 1;
          this.asteroids.unshift(asteroid);
          break;
        }
      } else {
        log.push(`ASTEROID avoided safely (speed ${speed} under Safe Speed of ${asteroid.max_speed})`);
        asteroid_events.push({
          pos: asteroid.pos,
          event: 0,
        });
      }
    }
    this.heat += dheat;
    if (this.heat > MAX_HEAT) {
      log.push('', '**OVERHEATING!  LOSING CONTROL!  CRASH!**');
      this.done = true;
    } else if (win) {
      log.push('', '**SAFETY** reached.');
      this.done = true;
      this.won = true;
    }
    for (let ii = 0; ii < dheat; ++ii) {
      this.discard.push(-1);
    }
    if (!this.done) {
      this.draw();
    }
    this.pos = end_pos;
    this.last_move = {
      asteroid_events,
      hand: last_move_hand,
      start_pos,
      end_pos,
      speed,
      cooling: eff_cooling,
      heat: dheat,
    };
    this.animating = true;
    this.t = 0;
  }
}

let travel_state: TravelGameState | null = null;

export function travelGameActive(): boolean {
  return Boolean(travel_state);
}

export function travelGameCheck(force_no: boolean): boolean {
  let game_state = crawlerGameState();
  let { floor_id } = game_state;
  if (floor_id !== 7 || force_no) {
    travel_state = null;
    tickLoopingSound(null);
    return false;
  }
  if (travel_state && travel_state.transitioning || crawlerController().transitioning_floor) {
    tickLoopingSound(null);
    return false;
  }
  if (!travel_state) {
    travel_state = new TravelGameState();
  }
  tickLoopingSound(`ship/engine_${travel_state.gear}`);
  return true;
}

const ASTEROID_NEXT_X = 198;
const ASTEROID_NEXT_Y = 70;
const ASTEROID_NEXT_W = 92;
const ASTEROID_NEXT_H = 30;
const CARDSX0 = 3;
const CARDSYSEL = 198;
const CARDSYUNSEL = 221;
const CARDW = 50;
const CARDH = CARDW * 370/256;
const CARDSTOTALW = 338;
const CARDSPAD = (CARDSTOTALW - HAND_SIZE * CARDW) / (HAND_SIZE - 1);
const STATUSW = 196;
const STATUSH = 20;
const STATUSX = VIEWPORT_X0 + (render_width - STATUSW) / 2;
const STATUSY = 95;
const BARW = 196;
const BARH = 12;
const BARX = VIEWPORT_X0 + (render_width - BARW) / 2;
const BARY = 144;
const PAD = 2;
const WARNINGW = STATUSW;
const WARNINGH = STATUSH;
const WARNINGX = VIEWPORT_X0 + (render_width - WARNINGW) / 2;
const WARNINGY = 40;
const GEARX = 281;
const GEARY = 160;
const GEARW = 50;
const GEARH = 32;
const HEATX = 281;
const HEATY = 160 - 42;
const HEATW = 50;
const HEATH = 32;

let style = fontStyleColored(null, 0x000000ff);
let style_unimportant = fontStyleColored(null, 0x808080ff);
let style_danger = fontStyleColored(null, 0xFF4040ff);

export function travelGameFinish(): void {
  assert(travel_state);
  travel_state.transitioning = true;
  crawlerController().goToFloor(destination_floor, destination_key);
  queueTransition();
}

export function doTravelGame(): void {
  assert(travel_state);
  let { asteroids, hand, selected, done, animating } = travel_state;
  let z = Z.UI;
  let text_height = uiTextHeight();

  if (asteroids.length && 0) {
    let next = asteroids[0];
    let rect = {
      x: ASTEROID_NEXT_X,
      y: ASTEROID_NEXT_Y,
      w: ASTEROID_NEXT_W,
      h: ASTEROID_NEXT_H,
      z,
    };
    markdownAuto({
      font_style: style,
      x: rect.x + PAD * 2,
      y: rect.y + PAD,
      w: rect.w - PAD * 3,
      h: rect.h - PAD * 2,
      z,
      line_height: text_height * 0.667,
      text: `${next.goal ? '**SAFETY**' : 'NEXT ASTEROID'}\n
Distance: **${next.pos - travel_state.pos}**\n
${next.goal ? '' : `Maximum Safe Speed: **${next.max_speed}**`}`,
      align: ALIGN.HWRAP|ALIGN.VCENTER,
    });
    panel(rect);
  }

  if (MODE_DEVELOPMENT && keyDownEdge(KEYS.F)) {
    travel_state.selected[HAND_SIZE-1] = true;
    travel_state.go();
    travel_state.done = true;
    travel_state.won = keyDown(KEYS.SHIFT);
    travel_state.animating = true;
    travel_state.t = 1;
  }

  let game_state = crawlerGameState();
  game_state.angle = 0;
  game_state.pos[1] = 2;
  if (animating) {
    travel_state.t += getFrameDt();
    let p = travel_state.t / 1000;
    let last_move = travel_state.last_move!;
    if (p >= 1) {
      game_state.pos[0] = last_move.end_pos;
      travel_state.animating = animating = false;
      if (travel_state.done) {
        if (travel_state.won) {
          playUISound('ship_finish_success');
          travelGameFinish();
        } else {
          playUISound('ship_finish_failure');
          dialog('travelfail');
        }
      }
    } else {
      game_state.pos[0] = lerp(easeInOut(p, 2), last_move.start_pos, last_move.end_pos);
    }
    if (last_move.asteroid_events.length && game_state.pos[0] > last_move.asteroid_events[0].pos) {
      let event = last_move.asteroid_events.shift()!;
      if (event.event) {
        playUISound('ship_asteroid_gainheat');
      } else {
        playUISound('ship_asteroid_avoid');
      }
    }
  } else {
    game_state.pos[0] = travel_state.pos;
  }

  if (!done) {
    let num_selected = travel_state.numSelected();
    if (animating) {
      hand = travel_state.last_move!.hand;
    }
    for (let ii = 0; ii < hand.length; ++ii) {
      let card = hand[ii];
      if (card < -1) {
        continue;
      }
      let tile = card === -1 ? 'cooling' : `card${card}`;
      let x = CARDSX0 + (CARDW + CARDSPAD) * ii;
      let y = selected[ii] ? CARDSYSEL : CARDSYUNSEL;
      let rect = {
        x,
        y,
        z,
        w: CARDW,
        h: CARDH,
      };
      let spot_ret = spot({
        def: SPOT_DEFAULT_BUTTON,
        disabled: !selected[ii] && num_selected >= min(4, travel_state.gear + 1) || card === -1 ||
          animating,
        disabled_focusable: false,
        key: `card${ii}`,
        hotkey: KEYS['1'] + ii,
        ...rect,
      });
      if (spot_ret.ret) {
        selected[ii] = !selected[ii];
      } else if (spot_ret.focused) {
        if (selected[ii]) {
          rect.y -= CARDH * 0.05;
        } else {
          rect.y -= CARDH * 0.15;
        }
      }
      autoAtlas('cards', tile).draw(rect);
    }

    let overheat = travel_state.willOverheat();
    if (overheat) {
      let rect = {
        x: WARNINGX,
        y: WARNINGY,
        w: WARNINGW,
        h: WARNINGH,
        z,
      };

      markdownAuto({
        font_style: style,
        x: rect.x + PAD,
        y: rect.y,
        w: rect.w - PAD * 2,
        h: rect.h,
        z,
        // eslint-disable-next-line prefer-template
        text: '**WARNING**: Will reach ASTEROID exceeding safe speed' +
          ` (${overheat[2]}), generating **${overheat[0]}** excess heat!` +
          (overheat[1] ? ' (You will crash)' : ''),
        align: ALIGN.HVCENTER | ALIGN.HWRAP,
      });
      panel(rect);
    }
  }

  const font = uiGetFont();

  if (!done && !animating) {
    let rect = {
      x: GEARX,
      y: GEARY,
      w: GEARW,
      h: GEARH,
      z,
    };
    let { gear } = travel_state;
    let pred_gear = travel_state.numSelected();
    let can_go = travel_state.canGo();
    let gearmod = can_go ? pred_gear === gear-1 ? ' (-1)' : pred_gear === gear+1 ? ' (+1)' : '' : ' (?)';
    let cooling_text =
      (can_go ? `${can_go ? travel_state.predCooling() ? `0-${travel_state.predCooling()} cooling` :
      'no cooling' : 'invalid'}` : '[img=spacer]');
    markdownAuto({
      font_style: style,
      x: rect.x + PAD,
      y: rect.y,
      w: rect.w - PAD * 2,
      h: rect.h,
      z,
      text: `Gear ${can_go ? pred_gear : gear}${gearmod}\n${cooling_text}`,
      align: ALIGN.HVCENTER | ALIGN.HWRAP,
    });
    panel(rect);
  }

  if (!travel_state.won) {
    let rect = {
      x: HEATX,
      y: HEATY,
      w: HEATW,
      h: HEATH,
      z,
    };
    markdownAuto({
      font_style: style,
      x: rect.x + PAD,
      y: rect.y,
      w: rect.w - PAD * 2,
      h: rect.h,
      z,
      text: `Heat: **${travel_state.heat}**/${MAX_HEAT}`,
      align: ALIGN.HVCENTER | ALIGN.HWRAP,
    });
    panel(rect);
  }

  if (!done && !animating) {
    const BAR_MAX_DIST = 24;
    function drawLabel(style_use: FontStyle, value: number, y: number, text: string): void {
      value = clamp(value, 0, BAR_MAX_DIST);
      let x = BARX + (value ? value/BAR_MAX_DIST*BARW - 3.1 : 3);
      let text_w = font.getStringWidth(style_use, text_height, text.split('\n').pop()!);
      let dims = markdownAuto({
        font_style: style_use,
        x: x - 100,
        y: y + PAD,
        w: 200,
        z: z + 4,
        text,
        align: ALIGN.HCENTER | ALIGN.HWRAP,
      });
      if (y < BARY) {
        drawLine(x, y + dims.h + PAD*2, x, BARY + BARH * (1-0.24), z + 2.5, 0.5, 1, [0,0,0,1]);
      } else {
        drawLine(x, y, x, BARY + BARH * 0.24, z + 2.5, 0.5, 1, [0,0,0,1]);
      }
      panel({
        x: x - text_w/2,
        y,
        z: z + 4,
        w: text_w,
        h: dims.h + PAD * 2,
        eat_clicks: false,
      });
    }
    let speed = travel_state.speed();
    drawHealthBar(BARX, BARY, z + 1, BARW, BARH, speed, BAR_MAX_DIST, false);
    drawLabel(style, speed, BARY + BARH + 4,
      `Speed: **${speed}**`);

    for (let ii = 0; ii < asteroids.length; ++ii) {
      let asteroid = asteroids[ii];
      let dist = asteroid.pos - travel_state.pos;
      if (ii > 0 && dist > BAR_MAX_DIST) {
        break;
      }
      drawLabel(style, dist, BARY - BARH * 2,
        asteroid.goal ? 'SAFETY' :`ASTEROID\nDistance: **${dist}**`);
      if (!asteroid.goal) {
        drawLabel(ii === 0 && speed >= dist ? speed > asteroid.max_speed ? style_danger : style : style_unimportant,
          ii === 0 ? asteroid.max_speed : dist,
          ii === 0 ? BARY + BARH * 2.5 : BARY + BARH + 4,
          `ASTEROID\nSafe Speed: **${asteroid.max_speed}**`);
      }
    }
  }

  if (!done && !animating) {
    let rect = {
      x: STATUSX,
      y: STATUSY,
      w: STATUSW,
      h: STATUSH,
      z,
    };
    let can_go = travel_state.canGo();
    // let gear_text = `Gear: **${travel_state.gear}** -> **${can_go ? travel_state.numSelected() : '?'}**` +
    //   (can_go ? ` (${can_go ? travel_state.predCooling() ? `0-${travel_state.predCooling()} cooling` :
    //   'no cooling' : 'invalid'})` : '');
    // let speed_text = `Speed: **${travel_state.speed()}**`;
    // let heat_text = `Heat: **${travel_state.heat}**/${MAX_HEAT}`;
    // let y1 = rect.y + PAD + 4;
    // let y2 = y1 + text_height * 1.5;
    // markdownAuto({
    //   font_style: style,
    //   x: rect.x + PAD,
    //   y: y1,
    //   w: rect.w * 0.25 - PAD * 2,
    //   z,
    //   text: speed_text,
    //   align: ALIGN.HCENTER
    // });
    // markdownAuto({
    //   font_style: style,
    //   x: rect.x + rect.w * 0.25 + PAD,
    //   y: y1,
    //   w: rect.w * 0.25 - PAD * 2,
    //   z,
    //   text: heat_text,
    //   align: ALIGN.HCENTER
    // });
    // markdownAuto({
    //   font_style: style,
    //   x: rect.x + rect.w * 0.5 + PAD,
    //   y: y1,
    //   w: rect.w * 0.5 - PAD * 2,
    //   z,
    //   text: gear_text,
    //   align: ALIGN.HCENTER
    // });
    if (can_go) {
      const button_w = 58;
      if (buttonText({
        x: STATUSX + (STATUSW - button_w) / 2,
        y: rect.y + (rect.h - uiButtonHeight())/2, // y2
        w: button_w,
        text: 'GO!',
        hotkeys: [KEYS.SPACE, KEYS.ENTER],
      })) {
        travel_state.go();
      }
    } else {
      let gear = travel_state.gear;
      let mn = max(1, gear - 1);
      let mx = min(4, gear + 1);
      markdownAuto({
        font_style: style,
        x: rect.x + PAD,
        y: rect.y,
        w: rect.w- PAD * 2,
        h: rect.h,
        z,
        text: `Gear ${gear}: Select ${mn} to ${mx} SPEED cards to play`,
        align: ALIGN.HVCENTER
      });
    }
    panel(rect);
  }

  {
    let box = {
      x: HUD_X0 + PAD,
      y: HUD_Y0 + PAD,
      z,
      w: HUD_W - PAD * 2,
      h: game_height - HUD_PAD * 2 - PAD * 3,
    };

    let rules_dims = markdownAuto({
      ...box,
      text_height: text_height * 0.7,
      align: ALIGN.HWRAP | ALIGN.VBOTTOM,
      text: RULES,
    });

    let { log } = travel_state;
    log = ['[**SHIP\'S LOG**]', ''].concat(log);
    markdownAuto({
      ...box,
      text_height: text_height * 0.7,
      align: ALIGN.HWRAP,
      text: log.join('\n'),
    });

    log = [];
    travel_state.logAsteroid(0, log);
    travel_state.logAsteroid(1, log);
    box.y += box.h * 0.39;
    markdownAuto({
      ...box,
      text_height: text_height * 0.7,
      align: ALIGN.HWRAP,
      text: log.join('\n'),
    });

  }

  drawHUDPanel();
}
