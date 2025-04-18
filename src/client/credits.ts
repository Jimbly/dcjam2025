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

Thanks for playing!




[c=creditstitle]NAME OF GAME[/c]
[c=creditsname] (c)2025 Jimb Esser, et al, All rights reserved[/c]

Created in 9 days for [c=creditsname]DUNGEON CRAWLER JAM 2025[/c]


[c=creditstitle]LEAD - CODING - DESIGN[/c]
[c=creditsname]Jimb Esser[/c]

[c=creditstitle]ART - DESIGN[/c]
[c=creditsname]Nico Something[/c]

[c=creditstitle]WRITING[/c]
[c=creditsname]Steve Thompson[/c]

[c=creditstitle]SOUND FX[/c]
[c=creditsname]Tom Wiley Cotton[/c]

[c=creditstitle]MUSIC[/c]
[c=creditsname]Some Music Guy[/c]

[c=creditstitle]OTHER ASSETS BY[/c]
See page on itch.io for links

[c=creditstitle]AI CONTENT[/c]
No generative AI was used in the creation of this game
(except the Jam Anthem provided by the jam host)

[c=creditstitle]ENGINE[/c]
[c=creditsname]GLOV.js + crawler toolkit[/c]
[c=creditsname]MIT Licensed[/c]
[c=creditsname]by Jimb Esser[/c]

[c=xp]CREDITS MUSIC[/c]
[c=sanity]Zooperdan via Suno.ai[/c]

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
