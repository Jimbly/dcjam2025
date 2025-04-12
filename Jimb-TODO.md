TODO
* use Uncharted Wanders pattern - enemies move, auto-combat if adjacent
* tap-to-move (forward) is immediately starting repeat, no delay

PLAYER'S PLANNING
[ ] Find where THE ASCENDING RESEARCHER is docked
  - via bribe [stretch: or by following him around the station from a big enough distance]
[ ] Get past the guard
  - via bribe or very hard combat (requires best gear in shops and locations and a lot of consumables)
[ ] Open the safe
  - via Safe Combination obtained via bribe (stretch: or a very hard, timed lockpicking minigame)
[ ] Disappear into the black
  - via cash paid to the appropriate captain

CORE GAMEPLAY
* inventory screen, click things to select, click Equip to equip, see stats, use consumables
* map to change locations
* minigame to travel (just an "ok" button on the screen for now)
* locations:
  * space station
    * armor shop
    * weapon shop
    * general store?
    * department of nutrition processing (buy new chicken hats)
    * med-bay
    * talk to people in bar/cantina/around the station
      * each person has a 1-line, non-modal dialog if they have no interesting interactions, a one-time, multi-step dialog if something more interesting needs to happen, and then a different 1-line to remind you what's next / if they're complete
      * NPC1 offers to trade info on which bay THE ASCENDING RESEARCHER is docked in, wants a KEYITEM1
      * After a bribe of cash, THE BELEAGUERED ASSISTANT offers to trade you the SAFE COMBINATION in exchange for a KEYITEM2 (something to start a new life?)
      * (once you've met THE ESTRANGED GUARD) NPC3 offers to tell you THE ESTRANGED GUARD wants a DAZZLING GIFT (implied: to give to his wife)
      * THE SHADY CAPTAIN says to come by his ship in bay Z later to discuss an off-the-books transport
    * NPC4 in a shop says which planet KEYITEM1 are found on
    * SIGN in a shop says which planet DAZZLING GIFT are found on
    * giant ship docking bay with numbered bays
      * going into the right ship you meet THE ESTRANGED GUARD
  * docked ship (same map for all ships, probably)
  * danger locations (ideally each a separate style/environment, can all be similar if we run out of time):
    * probably they're all similar in flow with enemies protecting a treasure
    # find the KEYITEM1
    # find the KEYITEM2
    # find the DAZZLING GIFT
* combat
  * modal and automatic in a comic-book style

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
