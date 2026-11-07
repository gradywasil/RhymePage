# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

One shared RhymePage design across the website, the Capacitor Android app, and the Capacitor iOS app (owner decision, 2026-11-07). Native behavior is honored where it matters (safe areas, Android back button, system bars, keyboard, touch targets), but controls are not restyled per OS.

## Users

Songwriters writing their own lyrics. Phone and desktop are equal first-class settings (owner decision, 2026-11-07): catching and drafting lines on a phone, and longer editing and timing sessions at a desk. Collaborators can open notes that other users share with them.

## Product Purpose

RhymePage is a lyric-writing workspace that keeps notes, word suggestions, playback, and timing data together for a songwriter's own material. When the writer finishes a word, suggestions for its sound and meaning follow the line. Success means the writer stays in flow and their drafts, audio, and timing all live in one place.

## Positioning

Suggestions are driven by the word just finished in the lyric and steered by the note's own themes, inside the same notebook that holds the song's backing track and line/word timing. A rhyming dictionary or a separate notes app does not keep these together.

## Operating Context

- Write: title, themes (comma list that steers suggestions), and lyrics in one editor. Finishing a word fetches suggestions in eight categories: rhymes, sound-alikes, synonyms, antonyms, adjectives, nouns, related words, and frequent followers. Tapping a word inserts it at the cursor. Long-press (touch) or right-click (desktop) shows a definition.
- Sync: attach a backing track and time lyrics by line and optionally by word, manually or on a waveform. The web build also offers an optional browser-local alignment pass from a vocal guide (see CONTEXT.md for these terms).
- Play: play back the track with synced lyrics; export LRC/JSON.
- Notebook: own notes and notes shared with you; pin, tag, share by email, delete.
- Settings and profile: which suggestion categories are active, theme engine, results per category, profile details, account deletion.
- Guests can try the editor as a demo; saving requires sign-in (email/password or Google).
- Device drafts are kept as you type and recovered across sessions; cloud edits use revision checks and explicit recovery choices.

## Capabilities and Constraints

- Stack: React 19, Vite 7, Tailwind CSS 4, React Router 7, Firebase (Auth, Firestore, Storage, Functions), wavesurfer.js, Capacitor 8. DaisyUI 5 is being removed in favor of an owned design system (owner decision, 2026-11-07).
- Android app ID `com.rhymepage.app` is permanent. A custom `RhymePage` Capacitor plugin provides native Google credentials, recovery storage, text export, and back-button events on Android.
- iOS: to be added as a Capacitor platform. The owner has a Mac for Xcode builds; this development machine is Windows. iOS needs equivalents for the Android-only native plugin functions.
- The Android build excludes the speech model and browser alignment runtime; manual and waveform timing work without microphone permission there.
- Suggestions come from the Datamuse API; definitions from the Free Dictionary API.
- User-selectable themes are a product feature and must be kept (owner requirement); their visual design is open.

## Brand Commitments

- Name: RhymePage (one word, capital R and P). Public domain: rhymepage.com.
- App icon and favicon: the owner-supplied RF09 microphone/pencil kit in `assets/branding/rf09/`, already used for Android launcher, favicons, and the Apple touch icon. Native background color for it is `#A4DFCC`.
- Public support contact: Help@arrangedgodly.com.
- Voice in the existing copy is plain and direct, addressed to the writer ("Start writing. Finish a word and the suggestions follow.").

## Evidence on Hand

- Real Datamuse sample outputs for the landing demo are curated in `src/components/Landing.tsx`.
- No testimonials, user counts, press, or reviews exist; do not invent them.
- The Play feature graphic in `assets/branding/` predates the RF09 icon and needs a replacement before store publication.

## Product Principles

1. Writing comes first: on any screen size, the lyric and the next suggestion get the space; chrome, status, and settings stay out of the way.
2. Never lose a line: drafts, recovery, and save state are always truthful and visible without being alarming.
3. One RhymePage everywhere: the same design and themes on phone apps and the website, with native behaviors respected.
4. The writer's words are the material: suggestions and the writer's text are the content, and the UI frames them.

## Accessibility & Inclusion

Touch targets sized for phones, every theme readable at WCAG AA contrast, keyboard operability on desktop, and respect for reduced-motion settings.
