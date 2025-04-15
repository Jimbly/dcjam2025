TODO
* hat trader - first one's free, each next one much more expensive
* respawn all entities on non-heist ships when going in/out
  * respawn _some_ entities on planets (just based on entity type? As? property on the cell?)
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

Post-game fixes / polish
* (2024) add support for multiple fonts with different heights to dialog system and/or markdown - handwriting font would be cool
* (2024) Simple way to do dialog as pure text data, and then just add code callbacks the get ran beyond the go-to-dialog
* Things to merge into base toolkit:
  * sound_data.ts
  * music ticking and pulling music from level props
