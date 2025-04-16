TODO
* travel minigame
  * new race idea
    * racing someone, whoever's last gets robbed?
  * immediately move between lanes, but cooldown on moves
    * queued input though if you tap right twice, it should move right twice
  * same with shifting speeds
  * simple levelgen?
LEVEL MECHANICS / NPCs TODO
  * station
    * if `soldierdrunk` - find a clue about dazzling gift location near shops
  * zone 0
    * set up old racer to die upon entering, then can loot
  * bay 47
    * just a locked door inside; ship named "LIGHTNING BUG"

POLISH
* B varieties of weapons are uninteresting because by the time you could go and get them, you're powering through the current level, and strong enough for the next level
  * Maybe need to be stats-wise slightly better, or, rather, As slightly worse

ZONES
* respawn all B/C entities
  * path from entrance to bosses must be only A-entities
  * path to treasures is B/C
* Every Zone: 4 TnAs, 3 TnBs, 3 TnCs, 2 medkits, $2000K
* Zone 0
  * key1
  * weapon1, offhand1, torso1, weapon2b (T2), torso4 (T3)
* Zone 1
  * key2
  * offhand2, torso2, weapon2, offhand3b (T3), weapon4 (T3)
* Zone 2
  * key3
  * offhand3 (first), weapon3, torso3, offhand4 (T3)

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
* Need an extra ~2K for bribes now though! Increased drops by ~900

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
