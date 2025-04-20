import { autoReset } from 'glov/client/auto_reset';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyle } from 'glov/client/font';
import { KEYS, keyUpEdge, mouseDownAnywhere } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { buttonText } from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { game_height, game_width } from './globals';
import { tickMusic } from './music';
import { titleDrawBG, titleInit } from './title';

const text = `
[c=creditstitle]Thanks for playing![/c]




[c=creditstitle]NEBULARCENY[/c]
[c=creditsname] (c)2025 Jimb Esser, et al, All rights reserved[/c]

[c=creditsother]Created in 9 days for [/c][c=creditsname]DUNGEON CRAWLER JAM 2025[/c]


[c=creditstitle]LEAD - CODING - DESIGN - WRITING[/c]
[c=creditsname]Jimb Esser[/c]

[c=creditstitle]ART - DESIGN[/c]
[c=creditsname]Humane Tiger[/c]

[c=creditstitle]WRITING[/c]
[c=creditsname]Steve Thompson[/c]

[c=creditstitle]SOUND FX[/c]
[c=creditsname]Tom Wiley Cotton[/c]
[c=creditsname] (100% original recordings and design) [/c]

[c=creditstitle]MUSIC[/c]
[c=creditsname]Some Music Guy[/c]
[c=creditsother] (Didn't give us a name...) [/c]

[c=creditstitle]OTHER ASSETS BY[/c]
[c=creditsname]Music by The Hamster Alliance[/c]
[c=creditsname]Battle Disco - Cerberus - Funk Track - Lies The Trapper[/c]
[c=creditsname]www.hamsteralliance.com[/c]
[c=creditsother]See page on itch.io for links[/c]

[c=creditstitle]AI CONTENT[/c]
[c=creditsother]No generative AI was used in the creation of this game[/c]
[c=creditsother] (except the Jam Anthem provided by the jam host) [/c]

[c=creditstitle]ENGINE[/c]
[c=creditsname]GLOV.js + crawler toolkit[/c]
[c=creditsname]MIT Licensed[/c]
[c=creditsname]by Jimb Esser[/c]

[c=creditstitle]CREDITS MUSIC[/c]
[c=creditsname]Zooperdan via Suno.ai[/c]

[c=creditstitle]SPECIAL THANKS[/c]
[c=creditsname]The DungeonCrawlers.org Discord[/c]

`.split('\n');

const style_credits = fontStyle(null, {
  color: 0x000000ff,
});

const PAD = 20;
let scroll_pos = 0;
let looped = false;
let clicked = false;
function exit(): void {
  urlhash.go('');
  engine.setState(titleInit);
}
function doCredits(dt: number): void {
  tickMusic('dcjamtheme');

  titleDrawBG(dt);

  if (mouseDownAnywhere()) {
    clicked = true;
  } else {
    scroll_pos += engine.getFrameDt() * 0.03;
  }

  if (autoReset('credits')) {
    scroll_pos = -game_height + 32;
  }

  let y = -(scroll_pos);
  for (let ii = 0; ii < text.length; ++ii) {
    let line = text[ii];
    if (line) {
      y += markdownAuto({
        font_style: style_credits,
        x: PAD,
        y,
        w: game_width - PAD * 2,
        align: ALIGN.HCENTER|ALIGN.HWRAP,
        line_height: 9,
        text: line,
      }).h + 1;
    } else {
      y += 9;
    }
  }
  if (y <= 0) {
    scroll_pos = -game_height;
    looped = true;
  }

  if (looped || clicked) {
    if (buttonText({
      x: game_width - 24 - 4,
      y: 4,
      w: 24,
      h: 24,
      text: '←',
    })) {
      exit();
    }
  }
  if (keyUpEdge(KEYS.ESC)) {
    exit();
  }
}

export function creditsGo(): void {
  engine.setState(doCredits);
}
