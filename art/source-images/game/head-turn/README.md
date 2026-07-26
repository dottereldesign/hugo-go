# Hugo head-turn source and audit archive

```text
v2/
  hugo-head-turn-source-magenta.png
  hugo-head-turn-source-transparent.png
rejected-v3/
  README.md
  build_interleaved_sequence.REJECTED.txt
  source-sheets/
  extracted-interleaved/
```

The files under `v2/` form the one approved coherent source rotation.
`scripts/head_turn/extract_degree_frames.py` cuts its registered views into
the separate degree-named runtime files.

Everything in `rejected-v3/` is audit evidence only and must never be imported
by the app. The later optical-flow experiment was discarded rather than added
to this archive because every produced frame was unusable.
