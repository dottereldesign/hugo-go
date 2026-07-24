# HUGO GO! — game specification

## 1. Vision

HUGO GO! is a cheerful, single-player browser flight game starring Hugo. Its core is easy to understand immediately: keep Hugo airborne, move through openings, use a jetpack at the right moment, collect rewards, and travel as far as possible.

The interaction should feel as readable as Flappy Bird and as energetic as a lightweight Jetpack-style runner. Inspiration describes the control qualities only; characters, worlds, artwork, rules, and implementation remain original.

## 2. Current product state

The home screen is complete enough to preserve:

- HUGO GO! title treatment;
- Hugo’s profile and resource bar;
- animated Play call to action;
- quick activities, feature panels, and footer navigation;
- six illustrated worlds;
- desktop and compact mobile layouts;
- optional music and interface sounds.

Play opens `#/game`. That page is intentionally a placeholder until the flight engine exists. It must never fall through to an old or unrelated game.

## 3. Player promise

> Help Hugo flap, boost, and glide through surprising worlds. Learn their rhythm, squeeze through obstacles, and keep going.

The game should be:

- instantly understandable;
- satisfying in sessions under two minutes;
- friendly enough for children but responsive enough for skilled replay;
- readable on phones, tablets, and desktop browsers;
- playful rather than punishing;
- expandable across six distinctive worlds.

## 4. Core run

1. The player selects a world on the home screen.
2. Play opens the flight page.
3. Hugo begins moving horizontally at a steady base speed.
4. Tap, click, or press Space to flap upward.
5. Hold the boost input to spend jetpack energy for controlled lift.
6. Pass obstacles, collect items, and build distance.
7. Difficulty rises gradually through speed, spacing, and moving hazards.
8. A collision or leaving the safe flight area ends the run.
9. The result shows distance, pickups, and a clear Retry button.

There is no map select, chapter grid, placement phase, combat roster, or wave system.

## 5. Controls

| Input | Action |
|---|---|
| Tap / click / Space | Flap |
| Hold pointer / Space | Jetpack boost while energy remains |
| Release | Fall and preserve boost energy |
| Escape | Pause or return from overlays |

Touch must be the primary design constraint. Keyboard and mouse mirror it.

## 6. Flight model

The first prototype needs a small, tunable set of values:

- forward speed;
- gravity;
- flap impulse;
- maximum vertical speed;
- boost lift;
- boost capacity and recovery;
- collision radius;
- obstacle gap and spacing;
- difficulty ramp.

Physics should be deterministic enough for automated tests. Controls should favor forgiveness: input buffering, a short collision grace edge, and restrained camera movement are preferable to artificial difficulty.

## 7. Scoring

The main score is best distance. Supporting run metrics may include:

- obstacle gates cleared;
- pickups collected;
- close calls;
- time airborne;
- clean-flight streak;
- world discoveries.

Local bests can use browser storage. Accounts, online leaderboards, and monetization are future product decisions, not current dependencies.

## 8. Worlds

Worlds are themes for flight courses, not collections of maps or levels.

| World | Theme | Possible flight character |
|---|---|---|
| Forest | Ecosystems and nature | Branch tunnels, pollen currents, drifting seeds |
| Workshop | Machines and cause-effect | Pistons, belts, fans, magnetic gates |
| Word | Literacy and language | Letter trails, storybook arches, punctuation bursts |
| Number | Patterns, counting, and logic | Sequences, repeating gates, geometric motion |
| Space | Planets, gravity, and science | Low gravity, orbiting hazards, comet pickups |
| Music | Rhythm and sequencing | Beat-timed gates, sound pulses, tempo changes |

The first playable course should use one world only. Additional worlds should reuse the same stable flight engine and add data-driven presentation or obstacle behaviors.

## 9. Home-to-game contract

- The home screen owns profile, settings, world selection, and Play.
- Selecting a world updates local state but does not open a secondary selector.
- Play opens the game page with the selected world visible.
- Back returns to the home screen without losing the selection.
- Browser Back and Forward follow the same `#/home` and `#/game` states.

## 10. Visual direction

Keep the existing home screen’s polished, colorful, toy-like presentation. The future game should inherit:

- deep navy framing;
- luminous cyan, yellow, green, and purple accents;
- large rounded controls;
- readable silhouettes;
- short responsive motion;
- illustrated world-specific backgrounds;
- Hugo’s adventurous goggles-and-flight identity.

The flight view should remain less visually busy than the home screen so obstacles and Hugo are always readable.

## 11. Audio

The current soundtrack and interface sounds remain. Gameplay will need:

- flap;
- jetpack start and loop;
- pickup;
- gate clear;
- close call;
- collision;
- result;
- new-best celebration.

Audio must remain optional and unlock only after user interaction.

## 12. Accessibility

- All menus use semantic controls and visible focus styles.
- Core play must not depend on color alone.
- Reduced motion affects decorative animation, not gameplay timing.
- Important audio feedback also needs visual feedback.
- Touch targets should remain at least 44 CSS pixels.
- The game should support pause and restart without precise pointer movement.

## 13. Technical direction

The home experience is a TypeScript/Vite application. The flight game should be added behind a small interface:

```ts
interface FlightRun {
  start(worldId: WorldId): void;
  flap(): void;
  setBoosting(active: boolean): void;
  pause(): void;
  restart(): void;
  destroy(): void;
}
```

A Canvas renderer is appropriate for the future flight scene, while menus and results should remain accessible HTML.

## 14. First playable milestone

The first milestone is complete when:

- Hugo can flap and fall;
- holding boost spends and restores energy predictably;
- obstacles spawn and scroll;
- collision ends the run;
- distance increments;
- Retry works;
- desktop and touch inputs match;
- the selected home world reaches the run;
- unit tests cover physics and scoring;
- a browser test completes a deterministic short run.

Everything else is secondary until this loop feels good.
