---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components","src/index.css"]
---

# RhymePage app shell and screens

Scope: the whole signed-in and guest app (Write/Sync/Play editor, Notebook, Settings, Profile, auth, legal, 404), mobile-first for the Capacitor Android/iOS apps, with the desktop web matching. The marketing landing at `/` is web-only and keeps its typing demo. Mode: Operate.

Audience/job: songwriters drafting, timing, and replaying their own lyrics on a phone and at a desk, equally.
Must keep: Write/Sync/Play as three views of one song; the suggestion bottom sheet (peek/half/full on phone, docked card on desktop); landing typing demo; user-selectable themes (4-6, at least one dark, all AA).
Must avoid: corporate/SaaS template, decoration over writing, dark-studio neon cliché, and (owner feedback 2026-11-07 on the inner-sleeve build) anything stark or severe: square corners, heavy rules, all-caps labels, muted samey themes, blunt type, plain word grids.

History: the inner-sleeve direction (seed:330222005f657bfb) shipped and was rejected on device as weaker than the old app. The owner then chose option B "Colour Pop" from three re-skin mocks; that choice pins this direction.

## Direction contract

THESIS: Every song is a bright, friendly object: it opens on a header card in its theme colour, and the words that answer it arrive as colour-coded chips. Refuses the grey notes app and the stark print look.

OWN-WORLD: A softly tinted ground (default Coral #FFF4EE) with white surfaces floating on soft shadows; one bold theme accent (#C93D2A) filling each song's header card; a dark nav (#2B1B17). Fixed category colours (rhymes coral, sound-alikes amber, synonyms teal, antonyms violet, adjectives pink, nouns blue, related green, followers ochre). Raleway throughout, 800 titles, sentence-case 600-700 labels. Pills and 14-24px radii everywhere.

STORY: The writer sees their song in its colour, writes on a calm page, and taps tinted chips from the colour-coded sheet into the line.

FIRST VIEWPORT: Phone Write: accent header card (back to Notebook, save dot, Save pill, reset, 30px 800 title, themes), pill tabs Write/Sync/Play, lyrics 18px/1.85, white bottom sheet with 24px headword, colour category pills and tinted word chips, dark tab bar with a pill highlight on the active icon.

FORM: user-pinned re-skin option B "Colour Pop" (owner choice from a three-way mock). seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: the sheet's headword swaps to the newly finished word while the category pills hold still; chips fade in tint with match strength; the sheet snaps peek/half/full on phone.

Unresolved: iOS native Google sign-in and file export need Swift equivalents of the Android plugin; until then iOS falls back to web paths.
