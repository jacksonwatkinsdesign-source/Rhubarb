# Rhubarb — a short flight

A 16-bit ambient walking sim about going to the airport and getting on a plane.
There is no timer, no fail state, and nothing to be late for. You arrive, you
check a bag, you go through security, you sit at the gate and watch the sky
change, you board, and you watch the sun come up from above the clouds.

Rendered at **240×160** — GBA native — and integer-scaled to fit the window.

## Playing it

Open `index.html` in a browser. No build step, no server, no dependencies.

| | Keyboard | Touch |
|---|---|---|
| Walk | Arrow keys or WASD | D-pad (8-way, slide your thumb) |
| A — interact | Z (also Enter / Space / E) | A button |
| B — sip your coffee | X (also Q) | B button |
| Choose | Up / down, then A | D-pad up / down, then A |
| Slow down | Hold Shift | — |
| Stand up | Any direction | Any direction |

On a touch device the on-screen controls appear automatically and the game
letterboxes above them, so a thumb never covers the picture. They are DOM
elements rather than drawn into the framebuffer, so they stay finger-sized
however far the game is scaled up, and every active touch is hit-tested each
event — which is what makes holding a direction while tapping the button work.

Buying a coffee on the way to the gates is optional. If you do, you carry the cup for the rest of the trip.

Security is a real queue: roped into one lane you cannot walk around, one
passport at a time, and you go last.

A quarter of the way into the cruise the attendant offers you one. Say yes and
she brings it at the halfway mark; three-quarters through she comes back for
the empties. Whatever you are holding sits on the window ledge, so the cups
visibly accumulate and visibly go away.

One playthrough is roughly 8–12 minutes.

There is exactly one mechanic worth knowing: **while you are sitting at the
gate, time moves faster.** If you bought a coffee, half of it has to go before
the aeroplane comes — press B to sip. Finish the whole cup and you board
without it; stop at half and you carry it on. The sky changes, the aircraft taxis in, and boarding
is called. Standing up stops it. It is the only reward loop in the game and it
points the opposite way to every other game's.

## The level

`title → curb → checkin → security → coffee → gate → jetbridge → cabin → takeoff → sunrise`

The whole thing arcs from night to sunrise, and most of that is palette rather
than geometry. Six named passengers are placed at the gate and then again in
their seats on the aircraft, so the people you half-noticed while waiting are
the people you fly with.

## Layout

```
index.html            loads src/* in order; open this to play
src/core.js           framebuffer, integer scaling, input, tweens, cutscene runner
src/font.js           5x7 bitmap font (validated at load)
src/touch.js          on-screen d-pad and button for touch devices
src/sprites.js        16x24 body template + palette-swap actors
src/audio.js          chiptune pad engine and per-scene ambience
src/world.js          scene framework, dialogue, and the airport art vocabulary
src/scenes_ground.js  curb, check-in, security, the coffee kiosk
src/scenes_gate.js    concourse, the wait, jetbridge
src/scenes_flight.js  cabin, takeoff, sunrise
src/game.js           title screen and main loop
tools/build.js        inline everything into dist/rhubarb.html
tools/playthrough.js  drives the level end to end and reports every transition
tools/shoot.js        screenshots each scene into shots/
```

### Notes on the approach

**Everything is drawn in code.** There are no image files. Characters are
16x24 string-array sprites palette-swapped per person; environments are painted
from rectangles into the framebuffer. That is what lets a whole airport exist
without an art budget, and it is also the first thing you would replace with
real tilesets.

**One body, ten people.** Every character is the same three-tone template —
outline, mid, shade, highlight per material — recoloured through `RB.pal()`.
The player is a blue suit with a white collar and navy tie; the rest of the
cast are pitched to read apart at a glance in silhouette and hue. Sprite rows
are validated at load, because a sheared sprite is very hard to spot by eye and
very easy to introduce by miscounting one row.

**Cutscenes are generators.** `RB.Script(function*(){ yield RB.tween(...) })`
keeps the van arrival and the takeoff roll readable as sequences instead of a
pile of timer flags.

**Banding is deliberate.** Skies are quantised into bands and the sun's halo is
drawn as discrete rings, because smooth gradients are the fastest way to stop
looking like hardware from 1994.

## Testing

```
node tools/playthrough.js   # completes the level, fails loudly if it can't
node tools/touchtest.js     # drives the on-screen controls on a tablet viewport
node tools/shoot.js         # writes shots/*.png for every scene
node tools/spritesheet.js   # writes shots/spritesheet.png — the cast, every frame
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

- **No save.** The level is short enough not to need one, but it should
  remember you finished.
- **The cabin's near row** is drawn but you cannot interact with it; the window
  shade does not move, and the flight is on rails once you sit down.
- **Non-window seats** are decorative — the game seats you in 14A regardless.
- **No audio mixing per scene beyond a noise bed**; a real pass would want
  discrete PA announcements and footstep sounds.
- **Sprites are one template.** Ten characters share a body and a walk cycle.
  Per-character idle poses and a couple of extra silhouettes would do more than
  any other single change.
- **No haptics or button-repeat on touch**, and no way to reposition the pad.
