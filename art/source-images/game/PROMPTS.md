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

This full-screen background is retained as a legacy source but is no longer loaded by the game.

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

The six-frame transition sheet is retained as a legacy source but is no longer processed into the runtime build.

## Eight-frame jump/landing sheet

Use case: identity-preserve game animation asset.

Asset type: production eight-frame jump, fall, toe-touch, and landing sprite sheet for HUGO GO!, replacing the referenced six-frame transition sheet.

Use `hugo-transition-sheet-magenta.png` as the authoritative Hugo identity, face, outfit, proportions, polished stylized 3D rendering, right-facing side camera, and flat magenta sheet reference.

Preserve exactly the same 10-year-old Hugo and render exactly eight consecutive full-body frames in reading order:

1. planted running stride preparing to jump;
2. clear toe push-off with rear heel lifted;
3. rising jump with knees beginning to fold and hair/jacket catching air;
4. fully airborne jump pose transitioning toward flight;
5. falling approach with both feet extending downward;
6. first landing contact on the front/toe of one shoe, heel still visibly raised;
7. soft landing compression with knees bent and jacket settling;
8. smooth recovery into the running pose.

Use believable windswept chunky hair, hood and jacket-hem rustle, sleeve flutter, and anatomically consistent legs and feet. Frames must form one fluid action rather than unrelated poses.

Layout: exactly two columns by four rows, one pose per equal cell, uniform scale/camera/bounding box, generous magenta gutters, nothing cropped, no overlap, reading left-to-right then top-to-bottom.

Use a perfectly flat uniform `#FF00FF` chroma-key background across the entire image, with no floor, shadows, gradients, dividers, texture, reflection, or lighting variation; never use magenta on Hugo.

Preserve his face, natural round eyes, age, hair, teal jacket with orange trim and silver fern badge, cream shirt, navy shorts over black leggings, and white/teal shoes. Both shoe-thruster ports should be visible where anatomy allows. No flames, exhaust, smoke, sparks, glow, motion trails, text, numbers, labels, borders, logos, watermark, extra person, duplicate or missing limbs, headband, weapon, or franchise costume.

Generated sources: `hugo-jump-land-sheet-magenta.png` and `hugo-jump-land-sheet-transparent.png`.

## Scrolling forestry trail

Use case: illustration-story.

Asset type: wide scrolling ground/terrain strip for a portrait side-running children's game.

Create one original, very wide side-view New Zealand forestry trail terrain band: a warm dusty ochre path surface along the top, compact reddish-brown earth beneath, a few hand-painted stones, exposed roots, tiny tufts of hardy grass, and sparse fern tips. Use vibrant minimalist children's picture-book art with polished mobile-game readability, chunky shapes, and a clean collision silhouette. The surface must be broadly level and runnable, with gentle natural bumps only; avoid visual repetition and obvious tiled motifs.

Composition: panoramic horizontal strip. Terrain fills the bottom 42% of the image from edge to edge; the upper 58% is empty chroma-key space. Keep important detail away from the extreme left/right edges so the strip can scroll beside a second offset copy without a conspicuous seam.

Palette: scorched-red earth, warm terracotta, ochre dust, dark umber roots, and small fresh-green accents.

Use a perfectly flat uniform `#FF00FF` chroma-key background with no gradient, shadow, texture, reflection, horizon, scenery, or lighting variation. Do not use magenta anywhere in the terrain.

No characters, buildings, signs, words, logos, UI, hazards, coins, animals, cultural patterns, watermarks, photorealism, repeating checker/tile pattern, or large foreground object. No sky artwork—the game supplies a solid blue sky in code.

Generated sources: `trail-ground-magenta.png` and `trail-ground-transparent.png`.

## Six-frame double-jump sheet

Use case: identity-preserve game animation asset.

Use the supplied Hugo flight/run sheets as the authoritative identity, face, outfit, proportions, right-facing camera, polished stylized 3D rendering, and scale reference. Create exactly six sequential full-body frames for one spectacular but readable airborne double jump:

1. compact recoil/tuck immediately after the second input;
2. upward corkscrew beginning, knees tucked;
3. strongest twist at the jump apex;
4. body opening out of the spin;
5. legs and arms stabilizing toward flight;
6. clean right-facing glide pose that connects to the powered-flight loop.

Keep the same 10-year-old Hugo, natural non-caricatured facial anatomy, chunky windswept dark hair, teal jacket with orange trim, cream shirt, navy shorts over dark leggings, and white/teal shoes with visible heel thruster ports. Hair and jacket should follow the spin with believable delayed motion. No exaggerated eye shape or ethnic stereotype, franchise costume, weapon, headband, or Māori pattern.

Layout: strict two-column by three-row grid in reading order, one full-body pose per equal cell, consistent camera/scale, generous gutters, nothing cropped or overlapping. Perfectly flat uniform `#FF00FF` background. No flame, exhaust, smoke, sparks, glow, motion trails, floor, cast shadow, text, labels, borders, logo, watermark, extra person, duplicate limb, or missing limb.

Generated sources: `hugo-double-jump-sheet-magenta.png` and `hugo-double-jump-sheet-transparent.png`.

## Six-frame wall impact and recovery sheet

Use case: identity-preserve, non-injury game animation asset.

Use the supplied Hugo sheets as the authoritative identity, outfit, proportions, right-facing camera, polished stylized 3D rendering, and scale reference. Create exactly six sequential full-body frames for a playful Looney-Tunes-style wall collision and recovery without pain, injury, bruising, or distress:

1. surprised right-facing approach just before contact;
2. harmless frontal star-splat pose, torso flat to an invisible vertical wall, arms and legs spread;
3. compressed wobble while still attached;
4. peeling torso and head away from the wall;
5. compact recovery crouch/tuck;
6. strong upward/rightward escape pose that connects to flight.

Preserve the same 10-year-old Hugo, natural non-caricatured facial anatomy, hair, teal/orange jacket, cream shirt, navy shorts, dark leggings, sneakers, badges, and proportions. Keep the expression surprised and determined rather than hurt. No exaggerated eye shape or ethnic stereotype, franchise costume, weapon, headband, or Māori pattern.

Layout: strict two-column by three-row grid in reading order, one full-body pose per equal cell, consistent camera/scale, generous gutters, nothing cropped or overlapping. The invisible impact wall must not be drawn. Perfectly flat uniform `#FF00FF` background. No flames, exhaust, smoke, sparks, blood, bruises, injury marks, text, labels, borders, logo, watermark, extra person, duplicate limb, or missing limb.

Generated sources: `hugo-wall-recovery-sheet-magenta.png` and `hugo-wall-recovery-sheet-transparent.png`.

The two camera-facing splat/wobble poses were replaced at processing time by
`hugo-wall-splat-side-profile-magenta.png` and
`hugo-wall-splat-side-profile-transparent.png`. Those replacement frames preserve Hugo's
right-facing side profile, puffed cheek, palm-first contact plane, and harmless flattened
silhouette without looking toward the camera.

## Six-frame freefall glide sheet

Use case: identity-preserve game animation asset.

Use the supplied Hugo glide sheet as the authoritative identity, face, age, proportions,
outfit, colors, right-facing camera, and polished stylized 3D rendering reference. Create
exactly six sequential full-body frames of a fun forward wingsuit-style freefall glide,
without adding an actual wingsuit. Hugo uses his teal jacket and body posture like a
playful human glider: arms spread wide for a strong silhouette, torso pitched forward,
legs trailing, and hair and jacket reacting to airflow.

Animate a fluid loop: settle into glide, left shoulder dip, playful bank and slight grin,
level wide-arm soar, opposite shoulder dip, then return toward the first pose. The motion
must feel fast, buoyant, confident, parkour-like, and child-friendly rather than panicked
or limp.

Layout: strict two-column by three-row grid in reading order, one full-body pose per equal
cell, consistent scale and camera, generous gutters, nothing cropped or overlapping.
Use a perfectly flat uniform `#FF00FF` chroma-key background with no gradient, shadow,
texture, floor, or lighting variation. Do not use magenta on Hugo.

Preserve Hugo's natural round eyes, chunky windswept dark hair, teal jacket with orange
trim and silver fern badge, cream shirt, navy shorts over black leggings, and white/teal
shoes with heel thruster ports. No actual wings, cape, parachute, added clothing, flames,
exhaust, smoke, sparks, glow, motion trails, text, labels, borders, logos, watermark,
extra person, duplicate or missing limbs, camera-facing pose, franchise costume, weapon,
or headband.

Generated sources: `hugo-freefall-sheet-magenta.png` and
`hugo-freefall-sheet-transparent.png`.

## Thirty-frame shoe-jet flame loop

Generated with the built-in image-generation tool as three consecutive ten-frame source
sheets. All three sheets use a flat green chroma key and contain only the opaque flame
body; the runtime supplies the soft glow so alpha extraction stays clean.

### Frames 1–10

Use case: stylized-concept.

Asset type: production game VFX sprite sheet, shoe-jet flame animation, frames 1–10 of a
30-frame one-second loop.

Create exactly ten consecutive animation frames of one compact high-energy rocket flame
fired from a tiny sneaker heel jet. The motion is a smooth, temporally coherent steady
flicker: subtle plasma-core breathing, gentle orange-envelope bending, and slight pointed
tail sway. This is not ignition or shutdown.

The flame has a tight white-hot/cyan core at the top, pale yellow and rich golden-orange
body, and a small coral-red tapered tip. Use a polished stylized 3D mobile-game VFX
finish with a bold silhouette that remains crisp at tiny size.

Layout: strict five-column by two-row grid in reading order, exactly one flame per equal
cell and ten total. Every flame points vertically downward, begins at the identical
top-center origin, extends about 70% of the cell height, and uses the same scale, width
range, camera, and alignment. Use wide clean gutters, no dividers, no crops, and no
overlap.

Use a perfectly flat solid `#00FF00` chroma-key background with no shadow, gradient,
texture, reflection, floor plane, or lighting variation. No green inside the flame.
Flame only: no shoe, nozzle, character, smoke, detached spark, ember, glow spill, text,
number, label, border, grid line, watermark, or extra object. All ten frames must be
distinct adjacent moments rather than duplicates or unrelated designs.

Generated sources: `jet-flame-frames-01-10-green.png` and
`jet-flame-frames-01-10-transparent.png`.

### Frames 11–20

Use `jet-flame-frames-01-10-green.png` as the authoritative style, palette, grid, scale,
top-center origin, and flame-design reference.

Continue with exactly ten new consecutive frames of the identical steady-thrust flame.
These are frames 11–20 of the same loop. Preserve the flame identity while the
white/cyan core narrows then breathes wider, the golden-orange envelope bends gently
through center, and the coral-red tip sways smoothly. Adjacent frames must differ subtly
and sequentially with no sudden redesign.

Match the first sheet’s strict five-column by two-row grid, ten-flame count, downward
orientation, common top-center origin, scale, gutters, flat `#00FF00` background, and all
negative constraints exactly.

Generated sources: `jet-flame-frames-11-20-green.png` and
`jet-flame-frames-11-20-transparent.png`.

### Frames 21–30

Use the first sheet as the loop’s starting state and the second sheet as the immediately
preceding motion, palette, grid, scale, and flame-identity reference.

Create exactly ten new consecutive continuation frames, frames 21–30. Continue smoothly
from frame 20, then gradually return the cyan-white core, golden-orange envelope, and
small coral-red tail toward frame 1 so frame 30 loops seamlessly into frame 1. Use only
subtle sequential plasma breathing and gentle tail sway, with no ignition, shutdown, or
sudden redesign.

Match the two previous sheets’ strict five-column by two-row grid, ten-flame count,
downward orientation, shared top-center origin, scale, gutters, flat `#00FF00`
background, and all negative constraints exactly.

Generated sources: `jet-flame-frames-21-30-green.png` and
`jet-flame-frames-21-30-transparent.png`.

## Thirty-frame side-profile shoe-edge grind

Generated with the built-in image-generation tool as three sequential ten-frame sheets.
The initial flat-footed draft was rejected; only the corrected right-facing inline
shoe-edge sheets below are retained.

### Frames 01–10

Make frames 01–10 of a seamless 30-frame cable-grinding animation for Hugo, matching
the supplied game character sheets exactly.

Keep Hugo’s existing face, natural round brown eyes, warm medium skin, black windswept
hair, teal hooded jacket with orange trim, cream shirt, navy shorts over black leggings,
white-and-teal chunky sneakers, proportions, polished stylized 3D family-game art, and
right-facing direction.

The view must be a clear right-facing side profile. Use an inline grind stance: the
rightward shoe is visibly ahead and the other shoe is visibly behind, separated
horizontally along the direction of travel. The long axis of each sneaker follows the
invisible cable direction. Tilt both sneakers slightly so the outer side edge of each
sole—not the flat bottom—is the contact point. Show a narrow strip of each angled
underside so this side-edge contact is easy to read. Keep both shoe-edge contact points
on the same invisible horizontal baseline in all frames. This must look like balancing
on a narrow cable, not standing flat on a floor and not a front-facing squat.

Use a low, balanced sports pose with individually bent knees, forward-moving torso, and
arms counterbalancing. Across frames 01–10, smoothly shift weight toward the forward shoe
in tiny sequential increments. Add subtle continuous hair, hood, jacket-hem, sleeve, and
hand movement. Keep anatomy, shoes, face, camera, scale, and contact points consistent.

Exactly 10 equal animation cells arranged in a strict 5-column by 2-row grid, read
left-to-right top row then left-to-right bottom row. Exactly one complete full-body Hugo
in each cell. Equal generous padding; crop nothing. No visible grid, text, labels,
numbers, borders, or separators.

Do not include a cable because the game draws it. No wheels, rollerblades, skateboard,
snowboard, rail, poles, ground, flames, smoke, sparks, cast shadow, or scenery.

Use a perfectly flat uniform solid `#FF00FF` magenta background edge to edge with no
gradient, texture, glow, floor, shadow, vignette, or color spill.

Frame 10 continues into later frames and does not return to frame 01 yet. Avoid fused
legs, overlapping or merged footwear, extra limbs, shoe deformation, flat planted soles,
three-quarter/front body angle, identity drift, repeated poses, or crossing cell boundaries.

Generated sources: `hugo-grind-frames-01-10-magenta.png` and
`hugo-grind-frames-01-10-transparent.png`.

### Frames 11–20

Create frames 11–20 of the same seamless 30-frame Hugo cable-grinding loop. Match the
supplied corrected frames 01–10 exactly in right-facing side-profile camera, inline shoe
placement, identity, outfit, scale, contact baseline, polished stylized 3D game art, and
lighting.

Hugo remains in an inline grind: one sneaker ahead to the right, the other behind to the
left, clearly separated horizontally. The long axes of both sneakers follow the invisible
cable direction. Each ankle remains slightly banked so the outer side edge of each
sole—not the flat underside—is grinding the invisible line; neither sole may flatten like
standing on ground. The two narrow side-edge contact points stay on one identical
invisible horizontal baseline. Keep the clear shoe side profiles and the small visible
angled underside strip from the supplied corrected sheet.

Continue directly from frame 10. Frames 11–14 shift Hugo’s balance gently toward the
forward shoe and bend both knees a little more. Frames 15–17 form the lowest controlled
compression. Frames 18–20 begin a small rebound and transfer balance back toward the rear
shoe. Adjacent differences must be tiny, smooth, and sequential at 30 fps. Hair, hood,
jacket hem, sleeves, and fingers flutter continuously. Stable face, anatomy, footwear
design, shoe separation, and side profile.

Exactly 10 equal cells in a strict 5-column × 2-row grid, top row left-to-right then
bottom row left-to-right. One complete full-body Hugo per cell, equal generous padding,
nothing cropped. No grid, text, labels, numbers, border, or separators.

The cable is invisible and added by code. No rollerblades, wheels, skateboard, snowboard,
skis, rail, cable, posts, ground, props, flames, smoke, sparks, cast shadows, or scenery.

Perfectly flat uniform `#FF00FF` magenta background edge-to-edge, without gradient,
texture, glow, floor, vignette, shadow, or spill.

Frame 20 continues into frames 21–30; it does not close the loop yet. Avoid
front/three-quarter view, feet side-by-side, flat planted soles, fused legs,
merged/deformed shoes, extra limbs, identity drift, repeated poses, or cell crossings.

Generated sources: `hugo-grind-frames-11-20-magenta.png` and
`hugo-grind-frames-11-20-transparent.png`.

### Frames 21–30

Continue the supplied family-friendly video-game sprite animation with frames 21–30 of
the same cable-grinding loop.

Match the supplied character, face, hair, teal jacket, clothes, sneakers, polished
stylized 3D art, right-facing side view, scale, lighting, magenta background, and baseline
exactly.

Keep the same inline balance pose: one sneaker ahead to the right and one behind to the
left. Keep both sneakers seen from the side and slightly tilted, with their outer sole
edges on the same invisible contact line. Do not flatten the feet onto a floor.

Continue smoothly from the last supplied pose. Gradually rebound and transfer balance,
then ease back toward the first pose of the first sheet. Frame 30 should be a distinct
tiny in-between that flows directly into frame 01. Use small sequential movements in
knees, arms, torso, hair, hood, jacket, and hands. Keep anatomy, shoe separation, camera,
and scale stable.

Exactly 10 equal cells in a strict 5-column by 2-row grid, read left-to-right across the
top then bottom. One complete character in each cell, generous equal padding, nothing
cropped. No grid lines, text, numbers, labels, or borders.

Draw no cable or equipment. No wheels, rollerblades, board, rail, poles, ground, fire,
smoke, sparks, shadow, or scenery.

Background must be flat uniform solid `#FF00FF` magenta edge to edge, with no texture,
gradient, glow, floor, vignette, or shadow.

Generated sources: `hugo-grind-frames-21-30-magenta.png` and
`hugo-grind-frames-21-30-transparent.png`.
