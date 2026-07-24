# Hugo gameplay generation prompts

## Flight pose

Use case: production mobile-game character sprite.

Create an original 10-year-old boy named Hugo, of Japanese and New Zealand family heritage, shown flying toward the right. Depict him as an individual child with natural, non-caricatured facial features; avoid racial stereotypes, exaggerated eye shapes, or generic anime shorthand. He has a cheerful determined expression, wind-swept dark brown hair made of chunky readable locks, and warm medium-light skin. Two tiny compact jet thrusters are integrated into his sneaker heels/soles, each emitting a short crisp orange-yellow flame downward and slightly backward. His body leans forward, arms sweep behind him, and his knees are softly bent.

Style: polished stylized 3D mobile-game render, chunky readable proportions, crisp opaque silhouette. Outfit: teal-blue jacket with red-orange trim, cream T-shirt, navy shorts over dark leggings, white-and-teal sneakers, a tiny silver fern leaf badge, and a tiny red circular badge. No flags, cultural patterns, headband, weapon, text, logo, UI, scenery, smoke, or cast shadow. Exact side profile, one full-body pose, generous padding. Flat `#FF00FF` background; no magenta on the subject.

Generated source: `hugo-flight-magenta.png`.

## Run pose

Use `hugo-flight-magenta.png` as the exact identity, outfit, materials, badge, face, palette, lighting, and style reference.

Show the same Hugo sprinting toward the right on level ground in a strong forward-leaning ninja-style run. Both arms sweep behind/by his sides, one foot is planted and the other reaches back mid-stride. Shoe thrusters remain visible but inactive, with no flame, smoke, glow, sparks, or thrust.

Preserve the same natural, non-caricatured face, hair, skin, jacket, shirt, shorts, leggings, sneakers, and badges. No exaggerated eye shape, stereotype, headband, weapon, or franchise costume. Exact side profile, one full-body pose, consistent ground line, generous padding. Flat `#FF00FF` background; no magenta on the subject.

Generated source: `hugo-run-magenta.png`.

## Forest seasonal background

Use case: stylized-concept.

Asset type: production portrait mobile-game background plate for a side-scrolling runner/flight game.

Create an original richly illustrated Forest World background replacing the simple vector mountains and trees. It must remain believable when code gradually color-grades it through Spring, Summer, Autumn, and Winter.

Scene: a bright deep forest glade combining New Zealand and Japanese natural landscape cues—a distant elegant volcanic mountain with a small pale cap, layered blue-green foothills, tall rimu-like evergreens, graceful flowering sakura trees, natural silver-fern-like undergrowth, atmospheric depth, and a clear horizontal ground horizon near the lower tenth. No buildings, shrines, gates, signs, or cultural patterns.

Style: polished stylized 3D family mobile-game environment matching Hugo. Vertical 2:3 portrait composition, straight-on side-scroller viewpoint, calm upper HUD area, clear central flight corridor, denser foliage at the sides/lower edge, no foreground obstacle or character. Cheerful morning light; season-neutral greens, teal distance, pale cyan sky, restrained pink blossom, warm cream sunlight.

Constraints: no people, animals, coins, hazards, text, logo, UI, watermark, frame, Māori patterns/motifs, stereotyped cultural symbols, or cast shadow across the play corridor.

Generated source: `forest-season-source.png`.

## Eight-frame run-cycle sheet

Use `hugo-run-magenta.png` as the exact identity, outfit, materials, lighting, side camera, and polished 3D style anchor.

Create exactly eight sequential frames of Hugo completing one fast run stride to the right while preserving his forward lean and arms swept behind:

1. right-foot forward contact;
2. right-foot recoil/body lowest;
3. passing pose with left leg moving through;
4. airborne/up pose with left knee forward;
5. left-foot forward contact;
6. left-foot recoil/body lowest;
7. passing pose with right leg moving through;
8. airborne/up pose leading to frame 1.

Preserve the same 10-year-old Hugo face, natural non-caricatured anatomy, hair, skin, teal/orange jacket, cream shirt, navy shorts, leggings, sneakers, badges, proportions, and determined expression. No exaggerated eye shape or ethnic stereotype. Both shoe thrusters stay visible but inactive with no flame, smoke, sparks, glow, or thrust.

Layout: exactly two columns by four rows in reading order, one full-body Hugo per equal cell, identical right-facing profile/camera/scale/horizontal position, soles aligned to a common invisible baseline, generous cell padding, and wide magenta gutters. Flat uniform `#FF00FF` background with no dividers, shadows, gradients, floor, labels, numbers, checkerboard, text, logo, UI, extra person, missing/duplicate limbs, weapon, headband, franchise costume, or magenta on Hugo.

Generated sources: `hugo-run-sheet-magenta.png` and `hugo-run-sheet-transparent.png`.

## Six-frame powered-glide sheet

Use case: identity-preserve game animation asset.

Inputs: `hugo-flight-magenta.png` is the authoritative Hugo identity, outfit, face, materials, and flight-pose reference. `hugo-run-sheet-magenta.png` is the authoritative scale, rendering style, and sprite-sheet layout reference.

Render a production full-body powered-glide animation sheet for a portrait mobile side-scrolling game. Preserve the same Hugo: his exact face, natural round eyes, proportions, black windswept hair, teal jacket with orange trim and silver fern badge, cream shirt, navy shorts over black leggings, and white/teal shoes. Do not redesign or age him.

Create a seamless subtle powered-hover loop, not unrelated poses. Keep torso, head, body angle, both shoes, and the two metal shoe-thruster ports nearly locked to consistent screen coordinates. Animate believable secondary motion: hair tips stream and ripple, the jacket hood and lower hem rustle, sleeves flutter slightly, fabric settles and lifts, hands and knees make tiny stabilizing adjustments, and the body has a very small breathing/hover oscillation. Expression stays cheerful and focused.

Layout: a strict two-column grid with one full-body, right-facing Hugo per cell, uniform cells and equal gutters, the same camera/scale/bounding box, no overlaps, and no cropped hair, fingers, or shoes. Reading order is left-to-right, top-to-bottom. The generator returned six coherent poses, so the accepted production cadence is a two-column by three-row sheet.

Match the supplied polished stylized 3D render and soft studio lighting exactly. Use a perfectly flat uniform `#FF00FF` chroma-key background with no floor, shadows, gradients, texture, reflections, or lighting variation. Never use magenta in Hugo.

Critical constraints: no flame, fire, exhaust, smoke, sparks, glow, or motion trails; both metal thruster ports stay unobstructed for code-drawn fire. No text, numbers, labels, borders, dividers, logos, watermark, extra objects or people, duplicate limbs, or missing fingers.

Generated sources: `hugo-powered-sheet-magenta.png` and `hugo-powered-sheet-transparent.png`.

## Six-frame unpowered glide/fall sheet

Use case: identity-preserve game animation asset.

Inputs: `hugo-flight-magenta.png` is the authoritative identity/outfit/full-body reference. `hugo-powered-sheet-magenta.png` is the authoritative six-frame scale, camera, lighting, gutters, and grid reference.

Render exactly six sequential frames of the identical Hugo gliding toward screen-right after his shoe jets are released. Preserve his exact face, natural round eyes, age, proportions, hairstyle, teal jacket with orange trim and silver fern badge, cream shirt, navy shorts over black leggings, and white/teal shoes.

Create one seamless free-glide loop. Compared with the powered pose, tilt him only slightly more nose-down and let the bent legs trail a little. Keep the head, torso, body angle, and both shoes stable enough to avoid sprite jitter. Animate hair tips rippling backward, the jacket hood and lower hem fluttering in a gentle repeating wave, sleeves breathing, tiny hand/knee balance adjustments, and only a few pixels of settling. Expression stays cheerful, calm, and focused. Frame six loops smoothly to frame one.

Layout: strict two-column by three-row grid, exactly six full-body right-facing frames, uniform cells and equal gutters, same camera/scale/bounding box as the powered sheet, no overlaps, nothing cropped, in reading order.

Match the polished stylized 3D render exactly. Use a perfectly flat uniform `#FF00FF` background across all gutters with no floor, shadows, gradients, texture, reflections, or lighting variation.

Critical constraints: no flame, fire, exhaust, smoke, sparks, glow, or motion trails. Keep both thruster ports visible. No text, numbers, labels, borders, dividers, logos, watermark, extra objects or people, duplicate limbs, or missing fingers.

Generated sources: `hugo-glide-sheet-magenta.png` and `hugo-glide-sheet-transparent.png`.

## Six-frame takeoff/landing transition sheet

Use case: identity-preserve game animation asset.

Inputs: `hugo-run-sheet-magenta.png` is the authoritative run cycle and running pose. `hugo-powered-sheet-magenta.png` is the authoritative flight pose, identity, scale, materials, lighting, and six-frame layout.

Render exactly six ordered transition poses of the identical Hugo facing and travelling screen-right:

1. final forward-leaning run stride, feet close to ground, arms swept behind;
2. smooth crouched lift-off, knees compressing and jacket beginning to rise;
3. newly airborne, legs folding into the powered-flight pose, hair and jacket catching wind;
4. descending approach from flight, legs extending carefully toward ground;
5. soft two-foot landing compression, knees bent and torso forward, arms behind for balance;
6. recovery into the forward-leaning run stance, ready to connect to the run sheet.

These are consecutive in-betweens rather than unrelated poses. Hair and jacket progressively rustle. Preserve the exact face, natural round eyes, age, proportions, hair, jacket, badges, shirt, shorts, leggings, and shoes.

Layout: strict two-column by three-row grid, exactly six full-body right-facing frames, uniform cells and equal gutters, same camera/scale/bounding box as the powered sheet, no overlaps and nothing cropped.

Match the supplied polished stylized 3D game render exactly. Use a perfectly flat uniform `#FF00FF` chroma-key background with no floor, cast shadows, gradients, texture, reflections, or lighting variation.

Critical constraints: no flame, fire, exhaust, smoke, sparks, glow, or motion trails. Keep shoe thruster ports visible where possible. No text, numbers, labels, borders, dividers, arrows, logos, watermark, extra objects or people, duplicate limbs, or missing fingers.

Generated sources: `hugo-transition-sheet-magenta.png` and `hugo-transition-sheet-transparent.png`.
