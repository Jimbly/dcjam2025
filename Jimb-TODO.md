TODO
* change combat to happen when you step onto their square; show enemy stats when looking at them
* tap-to-move (forward) is immediately starting repeat, no delay
* don't load sprite_near (shouldn't show up in /texmem)

CORE GAMEPLAY
* inventory screen, click things to select, click Equip to equip, see stats, use consumables
* map to change locations
* minigame to travel (just an "ok" button on the screen for now)
* locations:
  * space station
  * docked ship (same map for all ships, probably)
  * danger locations (ideally each a separate style/environment, can all be similar if we run out of time):
* combat
  * modal and automatic in a comic-book style

COMBAT
* Stats:
  * ATK
  * DEF
  * ACC
  * DODGE
* Auto-resolve combat

HUD:
* (at least when exploring) health
* inventory button
* maybe current cash
* (maybe not) movement controls
* minimap


Polish
* face_camera sprites should sort by their farther Z (or somehow total distance, not frustum distance) - two trees at the same Z are drawing the farther (to the side) one first and it looks wrong
* auto-unload auto-atlases that are no longer in use?

Post-game fixes / polish
* (2024) add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* (2024) Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* Things to merge into base toolkit:
  * sound_data.ts
  * music ticking and pulling music from level props
