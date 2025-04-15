TODO
* don't load sprite_near (shouldn't show up in /texmem)
* hat trader - first one's free, each next one much more expensive
* paper-craft 3-4 tiers of enemies and gear, test that they work as expected
  * want:
    * death if going to other zones
    * 2-3 medkits to mostly clear the first zone
    * some hard enemy that is impossible with even T2 gear (maybe doable with T3)
    * find T2 gear and enough money to buy T2 hat
    * then:
      * third zone is still death
      * 2-3 medkits to mostly clear the second zone
      * find T3 gear and enough money to buy T3 hat
      * some hard enemy impossible with T2 gear, doable with T4
      * then:
        * 2-3 medkits to clear the third zone
        * find 1 piece of T4 gear, can afford T4 hat now, can beat old bosses
        * old bosses give other T4 gear
* respawn all entities on non-heist ships when going in/out
  * maybe also on planets?
* armor/weapon/offhand trader?
  * at least someone to buy all of your old stuff, maybe even sells it back forever
* travel minigame
  * add pursuer / lose condition
  * visually dodge the asteroids
  * heat and maybe gear to be bars

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
