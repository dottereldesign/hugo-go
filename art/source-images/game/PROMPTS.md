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

## 60-frame arms-back run cycle

Built-in image generation was used in reference-image mode. Each prompt used the
immediately preceding generated sheet plus `hugo-run-sheet-magenta.png`; the closing
sheet also used frames 01–10 to control the loop seam. The successful final prompts were:

### Frames 01–10

Create frames 01–10 of a seamless 60-frame running animation for the existing Hugo Go game hero, matching the supplied character sheets exactly.

Preserve Hugo’s established face, natural round brown eyes, warm medium skin, black windswept hair, teal hooded jacket with orange trim, cream shirt, navy shorts over black leggings, white-and-teal chunky sneakers, proportions, lighting, and polished stylized 3D family-game art. Keep a clear right-facing side profile and identical camera and scale in every cell.

Keep the existing cool anime-inspired arms-back sprint from the reference sheet: Hugo leans forward, looks ahead, and keeps both arms swept behind rather than pumping them like a normal jog. This is the start of a two-step run cycle. Frame 01 begins with the forward shoe contacting the invisible ground and the rear leg extended. Frames 02–06 absorb the step smoothly. Frames 07–10 push into the next airborne phase while the rear leg folds forward. Use tiny sequential differences between every adjacent frame. Hair, hood, jacket hem, sleeves, shorts, and hands move gradually in the wind.

Use the same invisible horizontal ground baseline in every cell. A contacting shoe meets it exactly; a lifted shoe remains visibly above it. Draw no ground and no shadow. Keep full-body placement and scale stable with generous padding.

Exactly 10 equal cells in a strict 5-column by 2-row grid, read left-to-right across the top and then the bottom. One complete full-body Hugo in every cell. No grid lines, text, numbers, labels, borders, or cropping.

Perfectly flat uniform solid #FF00FF magenta background edge to edge, with no gradient, texture, glow, floor, shadow, reflection, or spill.

No flames, smoke, sparks, trails, props, headband, weapons, rollerblades, extra clothing, text, or scenery. Avoid extra limbs, fused legs, deformed shoes, identity drift, camera drift, repeated poses, or cell crossings.

Frame 10 continues immediately into frame 11 and does not close the loop.

### Frames 11–20

Create frames 11–20 of the exact same seamless 60-frame Hugo Go running loop. The supplied new 10-frame sheet is the immediate motion reference; the original run sheet is the identity and art-style reference.

Match Hugo exactly: same face, hair, teal jacket with orange trim, cream shirt, navy shorts, black leggings, white-and-teal sneakers, proportions, right-facing side-profile camera, scale, lighting, polished stylized 3D family-game art, magenta background, and arms swept back.

Continue directly from frame 10 with tiny sequential in-betweens. Frames 11–14 complete the push into the first airborne stride. Frames 15–17 smoothly swing the opposite knee and shoe forward under the body. Frames 18–20 extend that shoe toward the next ground contact while the other leg trails. Maintain the same strong forward lean and both arms behind; do not switch to a conventional arm-pumping jog. Hair tips, hood, jacket opening and hem, sleeves, shorts, and hands follow through continuously in the wind.

Use the same invisible horizontal ground baseline. Shoes touch it only during contact; lifted shoes stay above it. No visible ground or shadow. Keep full-body placement and size stable.

Exactly 10 equal cells in a strict 5-column by 2-row grid, top row then bottom row in reading order. One complete full-body Hugo per cell, generous equal padding, nothing cropped. No grid, text, labels, numbers, borders, or separators.

Flat uniform #FF00FF magenta background edge to edge; no gradient, texture, floor, shadow, glow, reflection, or spill. No flames, smoke, sparks, trails, props, weapons, headband, extra clothing, text, or scenery. Avoid identity drift, extra limbs, fused legs, deformed shoes, camera/scale drift, duplicates, and cell crossings.

Frame 20 continues into frame 21 and does not loop.

### Frames 21–30

Create frames 21–30 of the same seamless 60-frame Hugo Go arms-back sprint. The new supplied sheet is the immediately preceding motion reference; the original sheet fixes identity and art style.

Match Hugo’s face, hair, teal/orange jacket, cream shirt, navy shorts, black leggings, exact sneakers, right-facing side profile, forward lean, arms swept behind, proportions, camera, scale, lighting, polished stylized 3D rendering, and magenta background exactly.

Continue directly from frame 20 in tiny sequential steps. Frames 21–24 bring the forward shoe into a clean opposite-foot ground contact and begin absorbing the step. Frames 25–28 lower the body slightly as that leg accepts weight while the trailing leg starts recovering. Frames 29–30 begin pushing backward toward the second airborne stride. Both arms stay naturally behind with only subtle shoulder, sleeve, hand, and finger follow-through. Hair, hood, open jacket, shorts, and trim flutter continuously without redesign.

Maintain one invisible horizontal ground baseline. A contacting sole meets it exactly and lifted shoes remain above it. Draw no ground or cast shadow. Stable full-body placement, camera, and scale.

Exactly 10 equal cells in a strict 5-column by 2-row grid in reading order. One complete Hugo per cell, equal generous padding, no cropping. No grid, numbers, text, labels, borders, or separators.

Uniform flat #FF00FF magenta edge-to-edge with no texture, gradient, glow, floor, reflection, shadow, or spill. No flames, smoke, sparks, trails, props, headband, weapons, extra clothing, or scenery. Avoid extra limbs, fused legs, shoe/face drift, camera drift, repeated frames, or cell crossings.

Frame 30 is the midpoint opposite-foot state and must continue into frame 31; it must not return to frame 01.

### Frames 31–40

Create frames 31–40 of the same seamless 60-frame Hugo Go arms-back sprint. The supplied newest sheet is the immediately preceding motion reference; the older reference fixes Hugo's established identity and art style.

Match Hugo exactly: same face, warm medium skin, natural round brown eyes, black windswept hair, teal hooded jacket with orange trim, cream shirt, navy shorts over black leggings, white-and-teal chunky sneakers, polished stylized 3D family-game rendering, right-facing side-profile camera, scale, lighting, forward lean, and both arms swept behind.

Continue directly from frame 30 with tiny sequential differences. Frames 31–34 complete the opposite-foot push backward. Frames 35–38 rise into the second airborne stride as the trailing leg folds and begins swinging forward. Frames 39–40 carry that knee smoothly beneath the body. Keep the arms-back silhouette; do not turn it into a conventional arm-pumping jog. Hair tips, hood, jacket opening and hem, sleeves, shorts, hands, and fingers follow through continuously in the wind.

Use one identical invisible horizontal ground baseline. A contacting sole meets it; lifted shoes remain visibly above it. Draw no ground or shadow. Keep the whole body centered consistently with stable size and generous padding.

Exactly 10 equal cells in a strict 5-column by 2-row grid, read left-to-right across the top row and then the bottom. One complete full-body Hugo in each cell. No grid lines, text, labels, numbers, borders, separators, or cropping.

Perfectly flat uniform solid #FF00FF magenta background edge to edge, with no gradient, texture, glow, floor, shadow, reflection, or spill.

No flames, smoke, sparks, trails, props, headband, weapons, rollerblades, extra clothing, text, or scenery. Avoid extra limbs, fused legs, deformed shoes, identity drift, camera drift, repeated poses, and cell crossings.

Frame 40 continues immediately into frame 41 and does not close the loop.

### Frames 41–50

Create frames 41–50 of the same seamless 60-frame Hugo Go arms-back sprint. The supplied newest sheet is the immediate motion reference; the original run sheet fixes Hugo's identity and established game-art style.

Match Hugo exactly: same face, warm medium skin, natural round brown eyes, black windswept hair, teal hooded jacket with orange trim, cream shirt, navy shorts over black leggings, white-and-teal chunky sneakers, polished stylized 3D family-game rendering, right-facing side-profile camera, scale, lighting, forward lean, and both arms swept behind.

Continue immediately after frame 40 using very small pose changes. Frames 41–44 bring the folded forward leg smoothly through beneath the body during the second airborne stride. Frames 45–47 are the high-flight portion of the stride. Frames 48–50 gradually extend that shoe forward and downward toward the next contact while the other leg trails behind. Preserve the cool arms-back sprint; no normal alternating arm pump. Hair tips, hood, jacket opening and hem, sleeves, shorts, hands, and fingers move in continuous wind-driven follow-through.

Maintain one identical invisible horizontal ground baseline. A contacting sole touches it exactly; all airborne shoes remain above it. No visible ground or shadow. Stable full-body size, placement, and camera with generous padding.

Exactly 10 equal cells in a strict 5-column by 2-row grid, read left-to-right across the top row, then the bottom. One complete full-body Hugo per cell. No grid lines, text, labels, numbers, borders, separators, or cropping.

Perfectly flat uniform solid #FF00FF magenta background edge to edge, without gradient, texture, glow, floor, shadow, reflection, or spill.

No flames, smoke, sparks, trails, props, headband, weapons, rollerblades, extra clothing, text, or scenery. Avoid extra limbs, fused legs, malformed shoes, identity drift, camera drift, repeated poses, and cell crossings.

Frame 50 continues immediately into frame 51 and does not close the loop.

### Frames 51–60

Create frames 51–60, the closing section of the same seamless 60-frame Hugo Go arms-back sprint. The newest supplied sheet is frames 41–50 and must flow directly into this sheet. The supplied opening sheet is frames 01–10 and frame 60 must be the immediate predecessor of frame 01, not a duplicate. The original sheet fixes Hugo's established identity and art style.

Match Hugo exactly: same face, warm medium skin, natural round brown eyes, black windswept hair, teal hooded jacket with orange trim, cream shirt, navy shorts over black leggings, white-and-teal chunky sneakers, polished stylized 3D family-game rendering, right-facing side-profile camera, scale, lighting, forward lean, and both arms swept behind.

Continue directly after frame 50 with tiny sequential pose changes. Frames 51–54 extend the forward shoe down toward the invisible baseline while the trailing leg lengthens behind. Frames 55–57 approach the original lead-foot contact. Frames 58–60 begin the first instant of contact and compression so frame 60 flows naturally into supplied frame 01. Do not copy frame 01 into frame 60; leave one small motion step between them. Preserve the cool arms-back sprint rather than a normal alternating arm pump. Hair tips, hood, jacket opening and hem, sleeves, shorts, hands, and fingers settle continuously toward their frame-01 positions.

Use the same invisible horizontal ground baseline as the sequence. Contacting soles meet it exactly and lifted shoes remain above it. No visible ground or shadow. Keep full-body position, camera, and scale stable with generous equal padding.

Exactly 10 equal cells in a strict 5-column by 2-row grid, read left-to-right across the top row and then the bottom. One complete full-body Hugo per cell. No grid lines, text, labels, numbers, borders, separators, or cropping.

Perfectly flat uniform solid #FF00FF magenta background edge to edge, with no gradient, texture, glow, floor, shadow, reflection, or spill.

No flames, smoke, sparks, trails, props, headband, weapons, rollerblades, extra clothing, text, or scenery. Avoid extra limbs, fused legs, deformed shoes, identity drift, camera drift, repeated poses, and cell crossings.

Frame 60 and frame 01 must be adjacent distinct poses in one seamless loop.

Generated sources: `hugo-run-60-frames-01-10-magenta.png` through
`hugo-run-60-frames-51-60-magenta.png`, with matching `-transparent.png` sources.

## Double Jump V2 — 16-frame timing-and-spacing prototype

Reference: `src/assets/game/hugo-double-jump-cycle.webp`

```text
Use case: stylized-concept. Asset type: production game character sprite atlas
on removable chroma key. Preserve the exact Hugo identity, face, age,
proportions, outfit, teal-blue jacket with orange trim, dark shorts/leggings,
white-and-teal shoes, side-profile camera, polished 3D animated-film game-art
style, and right-facing direction from the reference.

Create exactly 16 sequential full-body frames of one non-looping DOUBLE JUMP
V2, arranged in a strict equal-cell 4 columns x 4 rows atlas, read
left-to-right then top-to-bottom. Each cell contains exactly one Hugo with
generous safe padding and no body part crossing a cell boundary.

Motion design: frames 1-3 are airborne anticipation with progressively deeper
compact tuck and tiny spacing; frame 4 is the strongest compression; frame 5
is an explosive upward second-jump impulse with controlled
squash-to-stretch; frames 6-9 accelerate through one fast stylish
corkscrew/tuck, with noticeably wider pose spacing at peak speed rather than
sluggish extra in-betweens; frames 10-13 decelerate and open into a readable
forward-flight silhouette; frames 14-16 ease into a stable glide-ready pose.
Maintain smooth arcs for head, hips, hands, knees, ankles, and shoes. Hair and
jacket lag behind the torso and then settle at slightly different times.
Preserve believable volume during squash and stretch. Strong readable
silhouettes at mobile size. No flames; effects are separate.

Lock camera, character scale, registration, lighting, anatomy, costume, and
rendering across every cell. Flat pure #ff00ff magenta background only,
perfectly uniform with no shadow, gradient, floor, grid, labels, text,
reflection, glow, or texture. Avoid missing, extra, or merged limbs, duplicate
poses, frozen limbs, anatomy drift, face drift, scale drift, costume drift,
clipping, blur, motion blur, text, or watermark.
```

Generated source: `hugo-double-jump-v2-sheet-magenta.png`, with
`hugo-double-jump-v2-sheet-transparent.png` as the chroma-removed source and
`src/assets/game/hugo-double-jump-v2-cycle.png` as the normalized runtime atlas.

## Layered Hugo rig — 16 reusable puppet pieces

Reference: `src/assets/game/hugo-jump-land-cycle.webp`

```text
Use case: stylized-concept. Asset type: reusable 2D cutout-rig puppet-part
atlas for HUGO GO. Lock Hugo's exact identity, face, age, proportions, teal
jacket with orange trim, cream shirt, navy shorts over black leggings,
white-and-teal shoes, polished 3D family-game rendering, right-facing side
profile, palette, lighting, and material finish from the reference.

Create exactly 16 separate reusable puppet pieces in a strict equal-cell 4 × 4
atlas: torso/pelvis; head/neck/base hair; rear hair accessory; hood; near upper
arm; near forearm/hand; far upper arm; far forearm/hand; near thigh; near shin;
near shoe; far thigh; far shin; far shoe; rear jacket-tail flap; front
jacket-tail flap.

Every limb segment is straight and neutral, with its proximal joint at the top
center and distal joint at the bottom center. Shoes face right with the ankle
connection at upper-left. Pieces reconnect without gaps when layered. Near
parts are slightly brighter and far parts subtly darker. Lock scale and
construction. No joint markers, labels, text, grid lines, cast shadows, floor,
reflection, props, flames, full-body characters, bent limbs, anatomy drift,
costume drift, blur, clipping, or watermark.

Use a perfectly flat uniform #ff00ff magenta background edge-to-edge for
removal, with no gradient, texture, lighting variation, shadow, or spill.
```

## Walking V4 — geometry-fitted generated parts

References: `src/assets/game/hugo-layered-rig-parts.png` and
`src/assets/game/hugo-run-60-cycle.webp`

### Primary 4 × 4 parts atlas

```text
Use case: stylized-concept
Asset type: production 2D game character modular-parts atlas for a
deterministic skeletal walk rig

Create a strict 4 columns by 4 rows atlas of reusable side-profile Hugo body
parts for a confident upright walking animation. Preserve the same friendly
10-year-old Japanese/New Zealand boy hero, right-facing profile, turquoise
quilted jacket with orange trim, cream shirt, dark navy clothing and
white/turquoise trainers from the references.

Atlas order: torso plus pelvis; complete head, hair and neck; near upper arm;
near forearm plus relaxed hand; far upper arm; far forearm plus relaxed hand;
near thigh; near shin; near shoe; far thigh; far shin; far shoe; rear jacket
hem; front jacket hem; two empty cells.

Every cell is equal with one isolated part and generous padding. Arm and leg
segments must be straight horizontal socket-to-socket components, with
proximal joint at 25% width and distal joint at 75% width on the centerline.
Near/far equivalents must have identical silhouette length and thickness.
Torso is upright with hip at 50% width/80% height and neck at 54% width/20%
height. Shoes face right with visible ankle, heel and toe silhouette.

Perfectly flat uniform #ff00ff chroma background only; no shadows, gradients,
floor, grid, labels, text or watermark. Avoid full assembled characters,
duplicate/extra parts, bent segments, foreshortening, perspective drift,
mismatched lengths, clipping, motion blur and cell crossings.
```

Generated sources: `hugo-walk-v4-parts-magenta.png` and
`src/assets/game/hugo-walk-v4-parts.png`.

The head, torso, sleeves, hands and shoes were accepted. The four pre-bent leg
cells were rejected because their knee shape would fight the code skeleton.

### Corrective straight-leg atlas

```text
Use case: stylized-concept
Asset type: corrective production atlas for a deterministic 2D skeletal rig

Create exactly four disassembled straight trouser-covered components in a
strict 2 by 2 atlas: near thigh, near shin/calf, darker far thigh and darker
far shin/calf. Each component runs perfectly horizontally left-to-right.
Proximal socket is at 22% cell width and distal socket at 78%, on the same
centerline. Near/far equivalents have identical length and thickness; thighs
are slightly thicker than shins.

These are rigid paper-doll components, not whole legs and not poses. No foot,
shoe, pelvis, skin, hand or torso. Perfectly flat uniform #ff00ff background;
no shadows, gradient, floor, grid, label, text or watermark. Avoid bent knees,
L shapes, connected thigh-and-shin pieces, vertical or diagonal parts,
foreshortening, perspective drift and extra objects.
```

Generated sources: `hugo-walk-v4-legs-magenta.png` and
`src/assets/game/hugo-walk-v4-legs.png`.

### Side-profile torso (promoted in Walking V5)

```text
Use case: stylized-concept
Asset type: corrective single body component for a deterministic 2D skeletal
character rig

Create one isolated torso-plus-pelvis component for Hugo in exact right-facing
side profile and a confident upright walking posture. Preserve the turquoise
quilted jacket, orange trim, cream shirt edge and dark navy waist/shorts.
Chest subtly proud, shoulders relaxed and spine tall. No head, arms, hands,
thighs, lower legs or shoes. Keep hip and neck sockets on one mostly vertical
mechanical axis.

Perfectly flat uniform #ff00ff background; no shadow, gradient, floor, grid,
text or watermark. Avoid front view, assembled person, extra openings, wide
spread shoulders, bent body, foreshortening and cropped edges.
```

Generated source:
`hugo-walk-v4-torso-magenta.png` and
`hugo-walk-v4-torso-transparent.png`.

V4 generated this source but then displayed the front-facing primary-atlas
torso in its painted card. Walking V5 corrects that mismatch and promotes this
side-on source as `src/assets/game/hugo-walk-v5-torso.png`. V5 maps pelvis
source point `(620, 930)` to the rig hip, collar source point `(603, 115)` to
the neck, and derives the shoulder from the visible armhole. The open jacket
edge is therefore evaluated as part of the intended side silhouette rather
than silently replaced.

## Head Turn V1 — 24-view 360-degree identity atlas

Generated with the built-in image-generation tool in image-generation mode.
The approved head cell in `src/assets/game/hugo-layered-rig-parts.png` was
supplied as the only identity and rendering reference.

### Primary prompt

```text
Use case: stylized-concept
Asset type: production game-character head turntable sprite atlas

Create exactly 24 sequential views of Hugo's HEAD ONLY completing one smooth
360-degree horizontal yaw rotation. Preserve the supplied approved Hugo head
exactly: the same friendly 10-year-old Japanese/New Zealand boy, natural round
eyes, face proportions, skin tone, chunky wind-swept dark brown hair, teal
jacket collar at the neck edge, polished stylized 3D game rendering, lighting
and scale. Do not redesign, age, caricature or stereotype him.

Use a strict 6 columns by 4 rows atlas, read left-to-right then top-to-bottom.
Each equal cell is one evenly spaced 15-degree turntable view. Start at exact
screen-right profile, rotate through front, screen-left profile and back, and
return toward the opening right profile. Keep one fixed skull centre, head
size, eye line, camera height, crop and lighting across every cell. Adjacent
views must make small consistent angular changes; hair volume, ears, nose,
jaw, eyes and face contour must rotate with coherent three-dimensional volume.

HEAD ONLY: no torso, shoulders, arms, hands or body. A tiny collar edge may
remain only where it is inseparable from the approved neck silhouette. One
head per cell, centred with generous padding; nothing crosses a cell boundary.
Perfectly flat uniform #ff00ff magenta background edge-to-edge, with no
shadow, gradient, floor, grid, border, label, number, text or watermark.
Avoid repeated angles, skipped quadrants, mirrored facial details, changing
hair, face drift, scale drift, camera drift, extra features, clipping and
motion blur.
```

### Corrective angle-map prompt

```text
Rebuild this as an exact 24-view turntable rather than an approximate pose
sheet. Keep the same Hugo identity, head-only crop, scale, lighting, strict
6-by-4 grid and flat #ff00ff background. Every cell must advance exactly
15 degrees around the same vertical axis:

row 1: 0, 15, 30, 45, 60, 75 degrees;
row 2: 90, 105, 120, 135, 150, 165 degrees;
row 3: 180, 195, 210, 225, 240, 255 degrees;
row 4: 270, 285, 300, 315, 330, 345 degrees.

The cardinal views must be unambiguous: cell 1 exact right profile, cell 7
exact front, cell 13 exact left profile, cell 19 exact back. Continue through
the final quadrant toward the opening right profile without repeating or
stalling at the back. Preserve coherent 3D skull, hair, ears, eyes, nose, jaw
and face volume. No body, shoulders or extra objects.
```

Accepted source:
`art/source-images/game/head-turn/v2/hugo-head-turn-source-magenta.png`.
Transparent source:
`art/source-images/game/head-turn/v2/hugo-head-turn-source-transparent.png`.

The source contains 24 clean disconnected head silhouettes, but several cross
the nominal `6 x 4` cell boundaries despite the prompt. The initial fixed-cell
extraction is retained as
`src/assets/game/head-turn/v1/hugo-head-turn-cycle.png` for audit history.

`scripts/head_turn/build_stabilized_atlas.py` extracts the complete connected
silhouettes from the full transparent source instead of trusting the visual
grid. It normalizes each head to a 240-pixel height, centres it in a
`320 x 320` cell, and writes the accepted runtime asset
`src/assets/game/head-turn/v2/hugo-head-turn-stabilized-24.png`. The first 24
cells are the unique rotational views and cell 25 is an exact pixel copy of
cell 1.

`scripts/head_turn/extract_degree_frames.py` uses that single registered source
only. It makes no visual edits. It reorders the existing 24 clean views so the
front is `0°`, then saves every head as a separate transparent PNG:

```text
src/assets/game/head-turn/canonical-24/frames/
  hugo-head-yaw-cw-000-front.png
  hugo-head-yaw-cw-015.png
  …
  hugo-head-yaw-cw-090-left-profile.png
  …
  hugo-head-yaw-cw-180-back.png
  …
  hugo-head-yaw-cw-270-right-profile.png
  …
  hugo-head-yaw-cw-345.png
```

The adjacent `manifest.json` records direction, angle, source cell, filename,
and checksum. It is the only runtime order.

## Rejected head-turn generation experiments

The old V3 midpoint and bridge prompts are retained with their source images
under `art/source-images/game/head-turn/rejected-v3/`. They must not be reused
for production playback. The mistake was interleaving independently generated
sheets whose cell positions did not share a guaranteed angle map. The frames
were separate files, but their motion still reversed.

A later single-sheet 30-view generation also reversed at a profile-to-back
transition. A deterministic 24-to-30 optical-flow attempt preserved direction
but ghosted facial features. Both candidates were rejected whole. The final
rule is: use the 24 clean existing views rather than manufacture six damaged
ones to reach a round number.
