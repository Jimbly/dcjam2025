TODO
* add basic stats
* add bump-attack combat
  * enemy health bards
* add enemy turns / attacks

PLAYER'S PLANNING
[ ] Find where the mark is docked
  - via bribe [stretch: or by following him around the station from a big enough distance]
[ ] Get past the guard
  - via bribe or very hard combat (requires best gear in shops and locations and a lot of consumables)
[ ] Open the safe
  - via Skeleton key obtained via bribe (stretch: or a very hard, timed lockpicking minigame)
[ ] Disappear into the black
  - via cash paid to the appropriate captain

CORE GAMEPLAY
* inventory screen, click things to select, click Equip to equip, see stats
* map to change locations
* minigame to travel (just an "ok" button on the screen for now)
* locations:
  * space station
    * armor shop
    * weapon shop
    * general store?
    * med-bay
    * bar/cantina to talk to people
      * someone offers to trade info on which bay the target is docked in, wants a McGuffinX
      * someone offers to sell you info on where a skeleton key can be found
      * (once you know his name) someone offers to tell you the guard wants a McGuffinY
      * captain says to come by his ship in bay Z later to discuss an off-the-books transport
    * pamphlet/person in a shop says which planet McGuffinX are found on
    * pamphlet/person in a shop says which planet McGuffinY are found on
    * giant ship docking bay with numbered bays
      * going into the right ship you meet the guard and learn his name
  * docked ship (same map for all ships, probably)
  * danger locations (ideally separate, can all be the same if we run out of time):
    # find the McGuffinX
    # find the skeleton key (or, some treasure to trade for it)
    # find the McGuffinY
* combat

COMBAT
* Stats:
  * ATK
  * DEF
  * ACC
  * DODGE
* Bump to attack
* We move, they move
* Can move during combat (but they get an attack? maybe not?)

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
