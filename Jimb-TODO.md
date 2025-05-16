OTHER PEOPLE'S GAMES TO PLAY
* Chicken Hacker 64 (rail shooter) - Jacob Marks
* Runeweaver - camsha - Yahtzee combat
* The Fatal Error - Clockwork Chaos
* Wolfheat - Dungeon of Dreams II - Bomberman?!
* Indis - https://shitsurei.itch.io/party-animals
* RedComputer - https://iamernesto.itch.io/specimen
* DarkDes - https://darkdes.itch.io/drawngeon-tutoretta-easy-quest
* GiantDwarf - https://redbottom.itch.io/eggtravaganza

FINAL BUILD
* update and then enable autoatlas ignore config

TODO

Polish
* escape from travel map is also opening pause menu
* race game
  * use `combat-hit-crit-2` in race game upon death
  * ramp-up period with only a few asteroids
  * do a "safe!" thing for a moment so you stop pressing forward at the end? (and so if you're about to hit an asteroid you see it)
* display medkit count on hud and (H)
* pop-up upon getting any item except medkits, give quick equip option
* the pillar to the SW doesn't show up at the right time when rotating the camera

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
* face_camera sprites should sort by their farther Z (or somehow total distance, not frustum distance) - two trees at the same Z are drawing the farther (to the side) one first and it looks wrong
* Things to merge into base toolkit:
  * map_general and map_build_mode atlas split
  * healthbar as 9-patch?
