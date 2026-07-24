# HUGO GO! implemented game specification

## Product shape

HUGO GO! is a single-input, portrait-first endless runner/flight game. Hugo begins every run automatically on the Forest World ground. The player decides when to fire the two shoe jets and move upward.

Home **Play** goes directly to `#/game` and starts a fresh run. There is no level selection or intermediate screen.

## Current course

**Forest World — Rimu & Sakura Run** is the only playable course.

The home screen still shows Workshop, Word, Number, Space, and Music so the product can grow later. Those cards are visually muted, expose `aria-disabled="true"`, say **Coming soon**, and cannot replace Forest as the active course.

## Controls

| Device | Input | Action |
| --- | --- | --- |
| Touch | Tap the game | Apply one upward shoe-jet boost |
| Mouse/trackpad | Primary click in the game | Apply one upward shoe-jet boost |
| Keyboard | Space, Up Arrow, or W | Apply one upward shoe-jet boost |
| Any | Back home | End the active view and return home |

Input is discrete rather than hold-to-fly. Repeated taps/clicks produce repeated impulses.

## Run rules

1. The game begins in `playing` state with Hugo running on the ground.
2. The world scrolls automatically and gradually accelerates.
3. A boost changes Hugo from running to flight.
4. Gravity returns Hugo to the ground when the space below him is clear.
5. Only the fixed ground plane is safe for landing.
6. Logs, boulders, and stumps are solid hazards on their top, sides, and bottom.
7. Touching a hazard ends the run. The engine never snaps Hugo onto a hazard.
8. Coins are collected once and removed.
9. A crash freezes the run, saves its result, and shows **Fly again**.

The opening obstacle is placed far enough away for the player to see the running state and learn the control.

## Physics and collision contract

The logical canvas is `390 × 780` with ground at `y = 704`. Hugo uses a deliberately readable body hitbox separate from decorative hair, hands, and flame edges.

Simulation is split into fixed `1/120 s` substeps. The public advance function caps a single browser-frame contribution and subdivides it, so slow frames do not create large collision jumps.

Obstacle detection combines:

- inclusive axis-aligned overlap, where exact edge contact counts;
- swept rectangle collision using relative world motion;
- collision checks before any ground snap;
- fixed-step integration for vertical falls and horizontal scrolling.

This makes these outcomes explicit:

- a measurable positive gap is safe;
- exact edge contact is a collision;
- fast travel through a thin hazard is detected;
- a fall toward an obstacle top is a collision, never a landing;
- clear-ground descent lands exactly on the ground plane;
- a coin can increment the run total only once.

See `tests/engine.test.ts` for executable examples.

## Scoring and persistence

Distance is derived from world travel. A run result contains whole metres and collected coins.

`recordRun` updates:

- coins;
- XP (`distance + coins × 20`);
- level (`floor(total XP / 1000) + 1`);
- flight power;
- best distance;
- total run count;
- top five runs, sorted by distance then coins.

The home profile, missions, resource counters, best-distance footer, and local leaderboard use this state. Storage is device-local; no online identity is implied.

## Presentation

Hugo has two generated poses:

- grounded forward-leaning sprint with arms swept back;
- airborne pose with two visible shoe-jet flames.

The runtime scene is drawn procedurally so obstacle artwork and collision bounds stay aligned. It includes a distant volcanic mountain, evergreen forest, pink/red flowering trees and petals, and silver-fern-like plants. These are landscape and botanical cues, not cultural patterns.

## Cultural and character guardrails

Hugo is 10 years old and has Japanese/New Zealand family heritage.

- Use natural, individual facial anatomy.
- Do not use exaggerated eye shapes or visual shorthand for ethnicity.
- Do not turn heritage into a costume.
- Do not add Māori patterns or motifs.
- Japanese and New Zealand nature, food, language, geography, family life, and ordinary contemporary details can inform future worlds when handled specifically and respectfully.

## Mobile and accessibility

- Gameplay is designed for portrait orientation.
- The page and game canvas use `touch-action: none`.
- The game view is fixed to `100dvh` with hidden overflow and no document scrolling.
- Safe-area insets are respected by the game header and controls.
- Landscape phones receive a portrait-play message.
- HUD values are HTML text.
- Run start and game-over results are announced through an ARIA live region.
- Keyboard control is supported.

## Out of scope for this release

- additional playable worlds;
- multiple levels or maps;
- accounts and global leaderboards;
- monetization;
- multiplayer;
- generated animation cycles beyond the two essential poses;
- authored audio specifically for shoe jets, coins, and impacts.
