# Neutral idle 24 FPS bridge pass

The neutral loop remains five seconds long. Its 34 approved key drawings are
kept intact; one 50% temporal bridge is authored between every adjacent pair,
including `34 -> 01`. This yields 68 runtime drawings at 24 timing FPS and an
exact frame-01 bookend.

Each board is deliberately an **A / blank / B** layout. Only the blank centre
cell is extracted. The generator is instructed to preserve Outfit 03, a fixed
front-facing cream-chest-panel root, exactly two arms/hands/legs/shoes, and
grape-purple gum. It must not redraw the other cells as production assets.

Process:

1. Start with the registered approved PNGs.
2. Put only consecutive A and B poses on the same board.
3. Generate the centre 50% pose, then chroma-key the magenta board.
4. Extract only the centre cell, place it on the fixed 640 px canvas, and
   register it to the torso root when detection is reliable.
5. Validate every adjacent pair and retain the exact final-to-first seam.

Never build a bridge by interleaving frames from unrelated character sheets.
Keep every generated character sheet to a maximum of **12 poses**: more cells
makes figures too small and causes unreliable limbs, crop bleed, and weak
in-between continuity.
