TODO
* build out levels
  * switch zone 2 to use ship, and use station on the ships
  * station
  * ships
* display medkit count on hud and (H)
* on next combat playtest
  * decrease A varieties further - I didn't feel I needed the B varieties, or even remembered to go find them
  * when first entering zone 1+, save once, then tweak each fight to be a little harder
* equip stats changes green/red numbers for better/worse, grey the old
* Saturday polish
  * zone 2 - put only the item that have a B variety behind secret doors
  * zone 1 - needs some locked doors and keys
  * use the right enemies on the right floors
  * item descriptions and ensure they all fit reasonably

LEVEL MECHANICS / NPCs TODO
  * other ships
    * need dialog about being locked up tight

COMBAT POLISH
* B varieties of weapons are uninteresting because by the time you could go and get them, you're powering through the current level, and strong enough for the next level
  * Maybe need to be stats-wise slightly better, or, rather, As slightly worse

ZONES
* respawn all B/C entities
  * path from entrance to bosses must be only A-entities
  * path to treasures is B/C
* Every Zone: 4 TnAs, 3 TnBs, 3 TnCs, 2 medkits, $2000K
  doubled: 8 TnAs, 6 TnBs, 6 TnCs
* Zone 0
  * torso4 (T3), med1, med1, weapon1, weapon2b (T2), med1, offhand1, med1, $, $, $, torso1, key2
* Zone 1
  * weapon4 (T3), med1, med1, offhand2, med1, offhand3b (T3), torso2, med1, weapon2, key3
* Zone 2
  * offhand4 (T3), med1, med1, offhand3, weapon3, money 3000, torso3, key1

ECONOMY
* gear always in chests
  * also medkits, 2 per zone
  * also 1 big cash reward per level to fuel chicken hats
* money always from enemies? and (any that don't block higher tier loot) replenish
  * 50/100/150 ea
  * 500/1000/1500 per floor
  * shuttle is 100
  * medkits are 100?
  * 3000 total minus 1200 in expenses
    * big cash reward is just slightly less than cost of next chicken hat
      * 2000 each?
    * final hat is another 2K, requires a few grind trips back to Zone 2
* full run-through with no repeated monster kills, and forgetting to heal: ended with all stuff and $50, 2 medkits, not enough to beat guard, perfect!
* Need an extra ~2K for bribes now though! Increased drops by the same

Wrap-up
* Credits - put in names
* Prune unused atlases and tiles from used atlases
* Check background color / door fade color in each level
* Copy item descriptions/names from doc
* Disable `/`
* Add wander cat and nilo
* remove DEBUG events

Polish
* random NPCs moving around the station
* race game
  * ramp-up period with only a few asteroids
  * slightly bigger minimum gap between them
  * ignore asteroids we can't see when switching lanes? (or, just block/queue the lane switch?)
  * use `combat-hit-crit-2` in race game upon death
  * do a "safe!" thing for a moment so you stop pressing forward at the end?
* fullscreen map view spread color to full view
* fade out ent at start of combat
* critical health draw red
* show player HP as big colorful text in combat
* pop-up upon getting any item except medkits, give quick equip option
* the pillar to the SW doesn't show up at the right time when rotating the camera
* face_camera sprites should sort by their farther Z (or somehow total distance, not frustum distance) - two trees at the same Z are drawing the farther (to the side) one first and it looks wrong
* escape from travel map is also opening inventory
* auto-unload auto-atlases that are no longer in use?
* when interpolating past an NPC, push them farther to their appropriate side so they don't flicker in the camera

Post-game fixes / polish
* (2024) add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* (2024) Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* Deleting/renaming any .entdef (and wall and cell) crashes
* Things to merge into base toolkit:
  * sound_data.ts
  * music ticking and pulling music from level props
