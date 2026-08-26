# Rhubarb — a short flight

A 16-bit ambient walking sim about going to the airport and getting on a plane.
There is no timer, no fail state, and nothing to be late for. You arrive, you
check a bag, you go through security, you sit at the gate and watch the sky
change, you board, and you watch the sun come up from above the clouds.

Rendered at **240×160** — GBA native — and integer-scaled to fit the window.

## Playing it

Open `index.html` in a browser. No build step, no server, no dependencies.

| | |
|---|---|
| Walk | Arrow keys or WASD |
| Interact | Z (also Enter / Space / E) |
| Slow down | Hold Shift |
| Stand up | Any direction |

One playthrough is roughly 6–10 minutes.

There is exactly one mechanic worth knowing: **while you are sitting at the
gate, time moves faster.** The sky changes, the aircraft taxis in, and boarding
is called. Standing up stops it. It is the only reward loop in the game and it
points the opposite way to every other game's.

## The level

`title → curb → checkin → security → gate → jetbridge → cabin → takeoff → sunrise`

The whole thing arcs from night to sunrise, and most of that is palette rather
than geometry. Six named passengers are placed at the gate and then again in
their seats on the aircraft, so the people you half-noticed while waiting are
the people you fly with.

## Layout

```
index.html            loads src/* in order; open this to play
src/core.js           framebuffer, integer scaling, input, tweens, cutscene runner
src/font.js           5x7 bitmap font (validated at load)
src/sprites.js        12x18 body template + palette-swap actors
src/audio.js          chiptune pad engine and per-scene ambience
src/world.js          scene framework, dialogue, and the airport art vocabulary
src/scenes_ground.js  curb, check-in, security
src/scenes_gate.js    concourse, the wait, jetbridge
src/scenes_flight.js  cabin, takeoff, sunrise
src/game.js           title screen and main loop
tools/build.js        inline everything into dist/rhubarb.html
tools/playthrough.js  drives the level end to end and reports every transition
tools/shoot.js        screenshots each scene into shots/
```

### Notes on the approach

**Everything is drawn in code.** There are no image files. Characters are
string-array sprites palette-swapped per person; environments are painted from
rectangles into the framebuffer. That is what lets a whole airport exist without
an art budget, and it is also the first thing you would replace with real
tilesets.

**Cutscenes are generators.** `RB.Script(function*(){ yield RB.tween(...) })`
keeps the van arrival and the takeoff roll readable as sequences instead of a
pile of timer flags.

**Banding is deliberate.** Skies are quantised into bands and the sun's halo is
drawn as discrete rings, because smooth gradients are the fastest way to stop
looking like hardware from 1994.

## Testing

```
node tools/playthrough.js   # completes the level, fails loudly if it can't
node tools/shoot.js         # writes shots/*.png for every scene
node tools/build.js         # writes dist/rhubarb.html
```

`playthrough.js` is the one that matters: it walks to each trigger, presses it,
advances dialogue, waits in the chair at the gate, and reports if it goes 170
simulated seconds without reaching a new scene. It caught two genuine deadlocks
(a decorative pillar that blocked the only walking line, and interaction
triggers that restarted their own cutscene when the action key was held).

## About the music

The soundtrack is **an original arrangement written in the register of** Aphex
Twin's "Rhubarb" — a very slow major-7th pad cycle, heavy detune, no percussion,
long tails — synthesized live in the Web Audio API from pulse waves.

It is deliberately not a transcription. "Rhubarb" is a copyrighted composition
(Richard D. James / Warp), and a chiptune arrangement of it is a derivative
work. For a free release people do this constantly and it is usually tolerated;
for anything sold or on Steam it needs a sync licence. Prototyping against the
real track and shipping something original in the same register keeps the mood
without the risk.

## What an MVP leaves out

Honest list, roughly in the order I would fix them:

- **Sprite work.** One body template with palette swaps reads as a crowd at this
  resolution, but everyone walks identically. Per-character idle poses and a
  couple of extra silhouettes would do more than any other single change.
- **No save.** The level is short enough not to need one, but it should
  remember you finished.
- **The cabin's near row** is drawn but you cannot interact with it; the window
  shade does not move, and the flight is on rails once you sit down.
- **Non-window seats** are decorative — the game seats you in 14A regardless.
- **No audio mixing per scene beyond a noise bed**; a real pass would want
  discrete PA announcements and footstep sounds.
- **Touch controls are minimal** (tap-left-half to walk, right-half to act).
