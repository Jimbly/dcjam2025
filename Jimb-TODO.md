TODO
* play game through once (w/ controller?) - put in some new fallback music first
  * first run:
    * first zone; bought hat, have 843 + 3 medkits, didn't have to go back to heal; afforded all bribes, 163 left;
    * second zone; couldn't afford hat, have 1563
* Copy item descriptions/names from doc
* item descriptions and ensure they all fit reasonably
* build out levels
  * station
  * remove DEBUG events / debug nooks
  * random NPCs moving around the station
  * final station name into level file
* Prune unused atlases and tiles from used atlases:
  * Final pass, check for pink Xs; identical images (moon stairs in/out maybe unused/identical)
  * probably remove/flag unused : station detail3/4
  * remove test atlas - just need to move chest into another
* display medkit count on hud and (H)
* on next combat playtest
  * decrease A varieties further - I didn't feel I needed the B varieties, or even remembered to go find them
  * when first entering zone 1+, save once, then tweak each fight to be a little harder

Wrap-up
* Credits - put in names
* Check background color / door fade color in each level
* Check map tileset
* Add wander cat and nilo

Polish
* race game
  * use `combat-hit-crit-2` in race game upon death
  * ramp-up period with only a few asteroids
  * do a "safe!" thing for a moment so you stop pressing forward at the end? (and so if you're about to hit an asteroid you see it)
* pop-up upon getting any item except medkits, give quick equip option
* escape from travel map is also opening inventory
* sound hook upon unlocking doors

* the pillar to the SW doesn't show up at the right time when rotating the camera
* face_camera sprites should sort by their farther Z (or somehow total distance, not frustum distance) - two trees at the same Z are drawing the farther (to the side) one first and it looks wrong
* when interpolating past an NPC, push them farther to their appropriate side so they don't flicker in the camera

NOTES - ZONES
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

NOTES - ECONOMY
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

Post-game fixes / polish
* (2024) add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* (2024) Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* Deleting/renaming any .entdef (and wall and cell) crashes
* Things to merge into base toolkit:
  * sound_data.ts
  * music ticking and pulling music from level props
  * onetime event
  * make intrinsic name render callback, use the name parameter instead of how it's done now
