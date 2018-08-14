Javascript libGlov/GLOV.js framework
============================

* Files can be ES6 (through Babel)
* Server automatically restarts on any relevant file change
* Client automatically reloads on javascript or html change
* Client automatically dynamically reloads CSS file changes

Useful SublimeText 3 packages
* SublimeLinter
* SublimeLinter-jshint (requires `npm i -g jshint`)

Start with: `npm start` (after running `npm i` once)

Notes:
* The engine API (glov/*) is subject to change significantly, often changes with each Ludum Dare in which I use this engine ^_^
* To use MP3 audio files, convert all .wav to .mp3 at the end of development, then set `sound_manager.auto_mp3s = true`
* Before publishing, edit the meta tags in index.html, place a 1200x630px cover image for use on Facebook and Twitter shares.


TODO:
* input
  * dragging?
  * onMouseDown not firing, because isHovering is not set because of my handler changes?
* use spine for sequencing, or leave this until later?
* cleaner window resize handling (have to be checking this each frame anyway?)

* minify, bundle CSS, if we ever have more than 1
