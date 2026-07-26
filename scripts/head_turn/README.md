# Head-turn asset tools

- `build_stabilized_atlas.py` extracts and registers the 24 complete heads
  from the transparent source. Its atlas is retained for earlier Sandbox
  comparison cards and as the canonical extraction input.
- `extract_degree_frames.py` reorders that one coherent sequence to start at
  front, then writes 24 unchanged, individual, degree-named PNG files plus a
  manifest.

The final extractor accepts one source only. It has no code path for generated
bridges, cross-sheet interleaving, interpolation, or runtime atlas creation.
