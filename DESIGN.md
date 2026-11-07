---
name: RhymePage
description: A bright lyric notebook where every song opens on its own colour and suggestions arrive as colour-coded chips.
colors:
  sleeve: "#fff4ee"
  sleeve-2: "#ffe9e0"
  surface: "#ffffff"
  ink: "#2b1b17"
  ink-2: "#6b4c44"
  rule: "#f0d8ce"
  accent: "#c93d2a"
  on-accent: "#ffffff"
  accent-soft: "#ffe1d9"
  accent-text: "#c03a28"
  panel: "#2b1b17"
  panel-2: "#3a2823"
  on-panel: "#fff4ee"
  on-panel-2: "#cdb5ad"
  panel-rule: "#45302a"
  panel-accent: "#ff8a75"
  danger: "#b3261e"
  ok: "#1e7a4a"
  cat-rhyme: "#c93d2a"
  cat-soundAlike: "#a35a00"
  cat-synonym: "#0e7c74"
  cat-antonym: "#6a4bd0"
  cat-adjective: "#b8336f"
  cat-noun: "#2a64c2"
  cat-relatedWord: "#2c7a3a"
  cat-frequentFollower: "#8c5300"
typography:
  display:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headword:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lyric:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 450
    lineHeight: 1.85
  row-title:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 450
    lineHeight: 1.5
  chip:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.25
  control:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
  tab:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
  label:
    fontFamily: "Raleway Variable, Raleway, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.35
rounded:
  check: "7px"
  menu-item: "10px"
  field: "14px"
  tile: "16px"
  card: "24px"
  sheet: "26px"
  hero: "32px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  card-pad: "14px"
  lg: "16px"
  dialog: "22px"
  gutter-wide: "40px"
  touch: "44px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ink-hover:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.sleeve}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-line:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.sleeve-2}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
  button-sm:
    padding: "0 14px"
    height: "36px"
  icon-button:
    backgroundColor: "transparent"
    rounded: "{rounded.pill}"
    size: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "11px 16px"
    height: "48px"
  tab:
    backgroundColor: "{colors.sleeve-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.tab}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
  tag:
    backgroundColor: "{colors.sleeve-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "30px"
  tag-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px"
  song-header:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "4px 16px 16px"
  suggestion-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  word-chip:
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "44px"
  note-tile:
    textColor: "{colors.on-accent}"
    rounded: "{rounded.tile}"
    size: "48px"
  notice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "14px 16px"
  menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "6px"
  menu-item:
    textColor: "{colors.ink}"
    rounded: "{rounded.menu-item}"
    padding: "0 12px"
    height: "44px"
  menu-item-hover:
    backgroundColor: "{colors.sleeve-2}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    width: "28rem"
  tab-bar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.on-panel-2}"
    height: "62px"
  nav-item-active:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.on-panel}"
    rounded: "{rounded.tile}"
    height: "44px"
---

# Design System: RhymePage

## Overview

**Creative North Star: "Colour Pop"**

Every song is a bright, friendly object. It opens on a header card filled with the theme's accent, carrying the song's title in heavy white (or dark, on light accents) type, and the words that answer it arrive as chips tinted in their category's colour. The rest of the page stays calm: a softly tinted ground, white writing and suggestion surfaces floating on soft warm shadows, and one dark nav that anchors the screen.

Colour does two separate jobs and never mixes them. The theme accent says "this is your song" (the header card, the landing hero, the accent button, focus and caret). The eight fixed category colours say "this kind of word" (suggestion pills, word chips, and the note tiles that borrow them), and they stay the same in every theme so a writer learns "coral is rhymes" once. Density is phone-first: 44px touch targets, pill controls, and the same layout grows into a rail, editor and docked suggestion card on desktop.

The world rejects the grey notes app and the stark print look it replaced: no square corners, no heavy rules, no all-caps labels, no muted samey themes, no plain word grids.

**Key Characteristics:**
- Tinted ground, white floating surfaces, one dark nav; six themes re-colour the same roles.
- The accent fills each song's header card; it is a surface, not just a marker.
- Eight fixed category colours code every suggestion and tile each note.
- Raleway Variable throughout: 800 titles, 650-700 sentence-case labels and controls, 450 body and lyrics.
- Pills and 14-32px radii everywhere; nothing square.
- Soft, warm-tinted ambient shadows; depth is gentle lift, never hard edges.

## Colors

Each theme is a tinted ground, white (or deep, in dark themes) surfaces, a near-black ink of the ground's hue, one bold accent and a dark nav; the frontmatter values are the default Coral theme. Lemon, Sky, Mint (light) and Grape, Night (dark) carry the same roles; "auto" resolves to Coral by day and Night when the device is dark.

### Primary
- **Coral Pop** (accent): fills the song header card in the editor, the landing hero card, the accent button and the profile avatar. In Lemon and in both dark themes the accent is light, so on-accent turns dark.
- **Coral Text** (accent-text): the accent tuned to pass 4.5:1 as text on ground and surface. Focus outlines, the caret, link underlines, checked checks/radios/switches, the range thumb, the loading run, the pinned-note pin.
- **Coral Blush** (accent-soft): text selection and the 4px halo around a focused field.
- **Nav Coral** (panel-accent): the accent lifted for the dark nav: the active nav icon and focus rings inside the nav.

### Secondary: suggestion categories
Fixed across every theme and all dark enough to carry white text: **Rhyme Coral** (cat-rhyme), **Sound-alike Amber** (cat-soundAlike), **Synonym Teal** (cat-synonym), **Antonym Violet** (cat-antonym), **Adjective Pink** (cat-adjective), **Noun Blue** (cat-noun), **Related Green** (cat-relatedWord), **Follower Ochre** (cat-frequentFollower). Used solid for the selected category pill, the landing demo's category labels and the notebook's letter tiles; mixed toward surface (6-30%) for unselected pills and word chips.

### Neutral
- **Peach Ground** (sleeve): the page ground; also the text on ink buttons and selected tabs.
- **Deeper Peach** (sleeve-2): unselected tabs and tags, hover wash for quiet buttons, menu items and settings rows, range track, loading track.
- **Paper White** (surface): cards, the suggestion sheet, fields, menus, dialogs, notices.
- **Warm Ink** (ink) and **Faded Ink** (ink-2): primary text and the ink button/selected tab fill; secondary text, hints, placeholders, unselected tab text.
- **Blush Rule** (rule): field borders, dividers inside cards, scrollbar thumbs, the off switch track.
- **Dark Nav** (panel), **Nav Step** (panel-2), **Nav Text** (on-panel), **Nav Muted** (on-panel-2), **Nav Rule** (panel-rule): the desktop rail, phone tab bar and landing footer.

### Status
- **Alert Red** (danger) and **Saved Green** (ok): message and notice text, the danger button outline, destructive menu items.

### Named Rules
**The Two Colour Jobs Rule.** The theme accent means "your song"; category colours mean "kind of word". A category colour never marks app state, and the accent never codes a word type.

**The Category Colours Hold Still Rule.** The eight `--cat-*` values are identical in every theme. Theme blocks never redefine them.

**The Every Theme Is AA Rule.** ink, ink-2 and accent-text on sleeve and surface; on-accent on accent; on-panel, on-panel-2 and panel-accent on panel; white on every category colour: all at least 4.5:1 in every theme.

**The Roles Not Values Rule.** Components read semantic roles only. A theme is nothing but a block of role values; the one sanctioned literal is white text on a solid category colour.

## Typography

**Display Font:** Raleway Variable (with Raleway, system-ui, sans-serif), self-hosted via @fontsource-variable/raleway (wght axis)
**Body Font:** Raleway Variable (same family)

**Character:** One friendly geometric sans doing every job; its round forms match the pills, and hierarchy comes from weight (800 titles against 450 body), never from case or a second family.

### Hierarchy
- **Display** (800, 40px phone / 72px desktop, 1.08, -0.02em, balanced): the landing hero title, max 15ch. The landing's typed demo line uses 32px / 56px at 1.15.
- **Headline** (800, 34px phone / 44px desktop): page titles (Notebook, Settings). Section titles inside settings cards drop to 24px; landing section heads 28px / 40px.
- **Title** (800, 30px phone / 38px desktop): the song title in the accent header card, a bare input.
- **Headword** (800, 24px, -0.02em): the finished word heading the suggestion sheet. The wordmark uses 22px at the same weight.
- **Lyric** (450, 18px phone / 19px desktop, 1.85): the writing surface, max 48rem.
- **Row Title** (700, 17px): note titles on notebook cards; landing feature terms at 18px.
- **Body** (450, 16px, 1.5): running text; 14-15px for secondary copy, menu items (550) and nav items (600).
- **Chip** (16px; 650 / 600 / 500 by match strength): suggested words.
- **Control** (700, 15px; 14px small): buttons. **Tab** (700, 14px; 13px for category pills): pill tabs.
- **Label** (650, 13px, ink-2, sentence case): field labels, the "Suggestions" placeholder, tags.

### Named Rules
**The Sentence Case Rule.** Labels, tabs and buttons are sentence case with no added tracking. Uppercase tracked lines are not part of this world.

**The 800 Is For Names Rule.** 800 belongs to things with names: page titles, song titles, the headword, the wordmark, tile initials. Lyrics stay 450.

## Layout

Phone first, one column. Page content uses a 16px gutter (40px from 768px on Notebook and Settings); the editor's header card and tabs sit 12px from the phone edge (24px on desktop). Notebook cards stack with 12px gaps, become two columns from 640px and three from 1280px. Every card is `min-width: 0` so long lyrics truncate inside the phone width rather than pushing it.

From 768px the phone tab bar becomes a 224px dark rail (240px at 1024px) and the suggestion sheet becomes a white card docked right of the editor with 12px margins (320px wide, 416px at 1024px), its category pills wrapping instead of scrolling. Below 640px dialogs become bottom sheets.

The phone suggestion sheet snaps between peek (9rem, one sideways row of chips), half (min(19rem, 38dvh)) and full (64svh); the headword row cycles it. Chips flow as a wrapping 8px-gap cloud. The tab bar hides while typing. Safe-area insets come from env() on iOS and injected variables on Android; the dark tab bar runs under the gesture bar while its labels stay above it.

Reading measures: 48rem lyrics, 42-60ch prose, max-w-6xl notebook and landing, max-w-3xl settings.

**The Thumb Holds Still Rule.** When a new word is finished, only the headword and chips change; category pills and the sheet height stay where the thumb left them.

## Elevation & Depth

Soft lift. White surfaces float on the tinted ground with ambient shadows tinted by each theme's `--shadow` triplet (warm brown in Coral, navy in Sky; pure black, effectively invisible, in dark themes, where the surface step carries depth instead). The dark nav is depth by contrast, not shadow.

### Shadow Vocabulary
- **Card rest** (`0 8px 24px rgb(var(--shadow) / 0.08), 0 1px 2px rgb(var(--shadow) / 0.06)`): cards, the docked suggestion card.
- **Card hover** (`0 10px 28px rgb(var(--shadow) / 0.14)`): notebook cards under a pointer.
- **Sheet** (`0 -8px 28px rgb(var(--shadow) / 0.12)`): the phone suggestion sheet, lifting upward.
- **Notice** (`0 1px 2px rgb(var(--shadow) / 0.06)`): inline notices.
- **Menu** (`0 12px 32px rgb(var(--shadow) / 0.18), 0 0 0 1px var(--rule)`): overflow menus.
- **Dialog** (`0 24px 60px rgb(0 0 0 / 0.25)`) over a 40% black backdrop.
- **Focus halo** (`0 0 0 4px var(--accent-soft)`): focused fields.

### Named Rules
**The Soft Shadow Rule.** Shadows are wide, low-opacity and theme-tinted. No hard offset shadows, no dark outlines to fake lift.

## Shapes

Rounded and friendly. Every control is a pill (999px): buttons, icon buttons, tabs, tags, category pills, the nav's active-icon highlight, the switch. Containers step down in radius as they get smaller: 32px landing hero, 26px top of the phone sheet, 24px cards, header card and dialogs (24px top only as a phone sheet), 16px notices, menus, note tiles and nav rows, 14px fields and word chips, 10px menu items, 7px checkboxes. Radios and avatars are circles.

Borders are light: 1.5px rule around fields and line buttons, 1px rule dividers inside cards. Gradients only draw small shapes (the select chevron, the switch knob).

**The No Square Corners Rule.** Nothing interactive or containing has a 0 radius; the only straight edges are 1px dividers.

## Components

### Buttons
Chunky, friendly pills.
- **Shape:** pill, 44px minimum, 20px sides; small 36px / 14px; block variant for forms. 18px icons, 8px gap.
- **Ink:** ink fill, ground text; the default primary (New note, Sign in). Hover ink-2.
- **Accent:** accent fill, on-accent text; hover brightens 6%. On the accent header and hero, the inverse (on-accent fill, accent text) is the primary.
- **Line:** surface fill, 1.5px rule border; hover border ink-2.
- **Quiet:** text only, sleeve-2 wash on hover. **Danger:** danger outline and text; fills on hover.
- **States:** 140ms ease-out colour transitions; press scales to 0.97; disabled 45%; focus 2px accent-text outline at 2px offset (panel-accent inside the nav).
- **Icon button:** 44px circle, 20px icon, sleeve-2 (panel-2 in the nav) wash on hover.

### Tabs
- **Style:** pills 40px tall, sleeve-2 fill, 14px 700 ink-2 text, 8px apart, scrolling sideways without a scrollbar. Counts inline at 600, tabular.
- **Selected:** ink fill with ground text (on-panel fill inside the nav).

### Chips and tags
- **Tag:** 30px pill, sleeve-2, 13px 650 ink-2; pressed reverses to ink. On cards, tags are small `#tag` pills.
- **Category pill:** a 36px tab tinted 14% of its category colour (22% hover); selected is the solid category colour with white text.
- **Word chip:** 44px, 14px radius, ink text on a 20% / 12% / 6% category tint by match strength (weight 650 / 600 / 500); hover 30%, press scales to 0.96. Tap inserts; long-press or right-click shows the meaning.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** surface on the tinted ground.
- **Shadow Strategy:** card rest, card hover (see Elevation).
- **Border:** none; 1px rule dividers inside where rows stack (landing features).
- **Internal Padding:** 14px for note cards, 20-24px for settings sections, 20-40px on landing.

### Note card (notebook)
A white card, min 80px: a 48px, 16px-radius letter tile in a category colour chosen stably from the note id (white 800 initial), 17px bold title, muted first line, then small tag pills and sharing text. The whole card opens the note; pin and overflow sit above it. The pin shows on hover, focus or coarse pointers, and fills accent-text when pinned.

### Song header card (signature)
The editor's top: an accent-filled 24px card, 12px from the phone edge. A 44px row holds "back to Notebook", the save-state dot, a "Save" or "Sign in to save" pill (on-accent fill, accent text) and reset; then the bare 30px / 38px 800 title and a 14px "by Name · Themes:" line. Hover washes are white at 15%. Below it sit the Write / Sync / Play pill tabs and the lyric page.

### Suggestion sheet (signature)
A white sheet with a 26px top radius rising from the phone's bottom edge (a docked 24px card on desktop). Headword row (24px 800, lifting in from 45% opacity and 0.3em below over 260ms), a sideways strip of category pills with counts, then the chip cloud. Snaps peek / half / full over 260ms `cubic-bezier(0.32, 0.72, 0, 1)`.

### Inputs / Fields
- **Style:** surface fill, 1.5px rule border, 14px radius, 48px min, 11px 16px padding, 16px text (prevents iOS zoom). Label above with 6px gap; hints 13px ink-2.
- **Focus:** border turns accent-text with a 4px accent-soft halo.
- **Error / Disabled:** invalid border danger; disabled 55%.
- **Bare inputs:** the song title and lyrics are borderless and transparent; they are the page.
- **Check / radio:** 22px, 2px ink-2 border, 7px radius (circle for radio); checked fills accent-text with a surface inset ring.
- **Switch:** 48x28 pill, rule track, white knob sliding over 180ms; on is accent-text.
- **Range:** 6px sleeve-2 pill track, 22px accent-text thumb with a white ring.

### Navigation
- **Phone:** dark tab bar, 62px items, 22px icon over a 12px 600 label. The active item puts its icon in a 56x32 panel-2 pill in panel-accent, label on-panel; inactive on-panel-2.
- **Desktop:** 224-240px dark rail with the 22px 800 wordmark, 44px nav rows (15px 600, 18px icon, 16px radius); active is a panel-2 row with a panel-accent icon. The account block sits below a panel-rule.

### Menus, dialogs, notices, loading
- **Menu:** surface, 16px radius, 6px padding, menu shadow; 44px items (15px 550, 18px ink-2 icon, 10px radius), sleeve-2 hover; danger items in danger.
- **Dialog:** surface, 24px radius, max 28rem, 22px padding, actions right-aligned; a bottom sheet below 640px.
- **Notice:** surface, 16px radius, 14px 16px padding, 14px text; danger and ok change text colour only.
- **Loading:** a 120x4 sleeve-2 pill with an accent-text pill running along it (1.1s); reduced motion shows it static at half opacity.

## Do's and Don'ts

### Do:
- **Do** read only semantic roles so all six themes stay correct, and keep the eight category colours fixed across themes.
- **Do** fill each song's header card with the theme accent and put white surfaces for writing and suggestions on the tinted ground.
- **Do** colour suggestions by category: solid for the selected pill, 6-30% tints toward surface for chips, fading with match strength.
- **Do** use pills for every control and 14-24px radii for containers.
- **Do** set titles at 800 with -0.02em, labels and controls in sentence case at 650-700, lyrics at 450 with 1.85 leading.
- **Do** keep tap targets at 44px (word chips, buttons, icon buttons, menu items, nav rows) and field text at 16px.
- **Do** lift surfaces with the soft, theme-tinted shadows from the Elevation section.
- **Do** honour reduced motion: the sheet, headword lift, chip press, loading run and control transitions all switch off.

### Don't:
- **Don't** use square corners, heavy rules or four-sided ink outlines.
- **Don't** set labels, tabs or buttons in uppercase or add letter-spacing to them.
- **Don't** use a category colour to mark app state, or the theme accent to code a word type.
- **Don't** redefine `--cat-*` inside a theme block or add a theme that fails any AA pair.
- **Don't** show suggestions as a plain word grid; they are tinted chips.
- **Don't** use hard offset shadows or dark outlines for lift.
- **Don't** add a second typeface; Raleway Variable is the only family.
- **Don't** let a new lookup move the category pills or the sheet height under the writer's thumb.
