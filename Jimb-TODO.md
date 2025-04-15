TODO
* combat balance - it's a walk in the park as soon as you get 1-2 of the items? 0 medkit use?
* respawn all entities on non-heist ships when going in/out
  * respawn all B/C entities
    * path from entrance to bosses must be only A-entities
    * path to treasures is B/C
* always show living creatures on the map in explored areas
* icon for unlooted chest on map (entity icon? loot property + entity?)
* allow using medkits during combat
* warning on enemy stats if they're a higher tier than you (expected damage of > 50% hp?)
* armor/weapon/offhand trader?
  * at least someone to buy all of your old stuff, maybe even sells it back forever
* travel minigame
  * add pursuer / lose condition
  * visually dodge the asteroids
  * heat and maybe gear to be bars

ZONES
* Every Zone: 4 TnAs, 3 TnBs, 3 TnCs, 2 medkits, $2000K
* Zone 0
  * key1
  * torso1, weapon1, offhand1, weapon2b (T1), torso4 (T3)
* Zone 1
  * key2
  * torso2, weapon2, offhand2, offhand3b (T2), weapon4 (T3)
* Zone 2
  * key3
  * torso3, weapon3, offhand3, offhand4 (T3)

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

Wrap-up
* Disable `/`

Polish
* the pillar to the SW doesn't show up at the right time when rotating the camera
* face_camera sprites should sort by their farther Z (or somehow total distance, not frustum distance) - two trees at the same Z are drawing the farther (to the side) one first and it looks wrong
* auto-unload auto-atlases that are no longer in use?
* when interpolating past an NPC, push them farther to their appropriate side so they don't flicker in the camera

Post-game fixes / polish
* (2024) add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* (2024) Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* Deleting/renaming any .entdef (and wall and cell) crashes
* Things to merge into base toolkit:
  * sound_data.ts
  * music ticking and pulling music from level props
