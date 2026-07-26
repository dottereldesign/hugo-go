# Rejected V3 cross-batch sequence

This archive documents the failed 59-frame approach. It is not runtime art.

The failure was not PNG extraction. The heads were cut out correctly, but the
playback order falsely treated independently generated batches as though they
shared one angle system:

1. the approved 24-view sequence and a separately generated midpoint sequence
   were alternated;
2. two more generated bridge batches were inserted near the seam;
3. those batches differed in facing direction, identity registration, and
   angular spacing; and
4. positional alpha checks passed even though visual rotation reversed.

That is why the old frames 1, 2, and 3 visibly turned right, jumped toward
front, and turned right again.

Hard rule: never interleave, append, or patch frames from separate generated
rotation sheets. Reject the whole candidate if its angle order is not
monotonic.

- `source-sheets/` contains the three independently generated batches.
- `extracted-interleaved/` contains the failed 59 individual PNGs.
- `build_interleaved_sequence.REJECTED.txt` is retained only to show the
  invalid logic and cannot be mistaken for an active build script.
