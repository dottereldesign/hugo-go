# Hugo torso turn assets

`canonical-24/` is the approved torso-only rotation. Runtime code loads its
individual PNG files in manifest order; it never slices the source sheet.

The generation source, keyed atlas, QA contact sheets, and references live
under `art/source-images/game/torso-turn/`. Rebuild the registered runtime
files with:

```powershell
python scripts/torso_turn/extract_torso_frames.py
```

Do not interleave cells from another sheet. A replacement must be reviewed as
one coherent rotation before extraction.
