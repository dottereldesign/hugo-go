# Paired midpoint source ledger

This folder records the source material for the 48-view Hugo head turn.

- `midpoint-magenta/` contains one built-in image-generation result for every
  adjacent approved pair.
- `midpoint-transparent/` contains the same 24 midpoint candidates after local
  chroma-key removal.
- `qa-contact-sheet.png` is generated after registration so the complete
  clockwise sequence can be reviewed in order.

The runtime copies the original 24 anchor files unchanged, then alternates one
registered midpoint between each pair. Midpoint filenames use `p5` for half
degrees so they remain portable on filesystems and URLs: for example,
`007p5` means `7.5 degrees`.

The seam pair is explicit: `345 -> 352.5 -> 000`. No file in this folder is a
sprite sheet, and no output is ordered by mixing cells from independent sheets.
