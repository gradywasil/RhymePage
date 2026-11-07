import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import type { RelationKey } from "../utils/rhymeApi";
import { TxtAnime } from "txtanime.js";

interface LandingProps {
  loggedIn: boolean;
}

/**
 * The hero types these in order, and the columns below show what RhymePage
 * returns for the last word of whichever one is on screen: writing, going,
 * undefeated. The two are kept in step by watching the hero, so the columns
 * cannot drift out of sync with it.
 */
const PHRASES = [
  "Can't stop writing",
  "Keep the flow going",
  "Always undefeated",
];

interface Column {
  label: string;
  /** Suggestion category, which sets the column heading's colour. */
  category: RelationKey;
  /** The four secondary categories only appear once there is room for six. */
  secondary: boolean;
  /** One sample per phrase, in the same order, eight words apiece. */
  samples: [string, string, string];
}

/*
 * Real Datamuse output for writing / going / undefeated. Three cells are
 * curated rather than fetched, because the API genuinely returns nothing
 * usable there: related words and adjectives for "undefeated", and related
 * words for "going", which comes back as "happen nba really".
 *
 * Adjectives and Nouns were previously the wrong way round -- "writing desk"
 * and "writing paper" are nouns that the word modifies (rel_jja), while
 * "creative writing" and "good writing" are the adjectives (rel_jjb).
 */
const WORDS_PER_SAMPLE = 8;

/** The last word of each phrase: what the panel is answering. */
const HEADWORDS = ["writing", "going", "undefeated"] as const;

/** Each one is something the app does today; see README.md. */
const FEATURES = [
  {
    title: "Drafts that stay put",
    body: "Writing is kept on your device as you type, and in your notebook once you save. If two versions ever disagree, you choose which to keep.",
  },
  {
    title: "Timed to the track",
    body: "Attach a backing track, time each line or each word on the waveform, then play it back with the lyric following along. Export LRC or JSON.",
  },
  {
    title: "Written together",
    body: "Tag, pin and share songs with other RhymePage writers by email. Notes shared with you sit in their own tab of your notebook.",
  },
] as const;

/** Beat between the phrase landing and the words answering it. */
const REVEAL_DELAY_MS = 450;

const COLUMNS: Column[] = [
  {
    label: "Rhymes",
    category: "rhyme",
    secondary: false,
    samples: [
      "exciting inviting moonlighting highlighting reciting biting slighting flyting",
      "knowing showing lowing bowing owing sowing rowing hoeing",
      "conceited defeated depleted treated pleated cheated heated maltreated",
    ],
  },
  {
    label: "Sound-Alikes",
    category: "soundAlike",
    secondary: true,
    samples: [
      "enticing striking enlightened writhing abiding frightened providing enlighten",
      "easygoing ongoing floating closing glowing roaming hoping flowing",
      "conceded excited committed beaten unheeded appreciated feted treason",
    ],
  },
  {
    label: "Synonyms",
    category: "synonym",
    secondary: true,
    samples: [
      "composition authorship penning script prose text lettering longhand",
      "release exit departure passing expiration loss leaving sledding",
      "triumphant victorious unbowed unbeaten unconquered unvanquished unbeatable supreme",
    ],
  },
  {
    label: "Related Words",
    category: "relatedWord",
    secondary: true,
    samples: [
      "verbal math directing exam poetry screenplay script essays",
      "concern rate price forth onward ahead homeward away",
      "streak season champion title record perfect unbeaten run",
    ],
  },
  {
    label: "Adjectives",
    category: "adjective",
    secondary: false,
    samples: [
      "creative own good historical much automatic academic fine",
      "church easy cinema sea thorough keep college school",
      "perfect flawless spotless dominant historic storied remarkable unblemished",
    ],
  },
  {
    label: "Nouns",
    category: "noun",
    secondary: false,
    samples: [
      "table desk campaign paper room master process case",
      "concern back further chronicle deeper out time down",
      "season team champion army record seasons teams enemy",
    ],
  },
];

const Landing = ({ loggedIn }: LandingProps) => {
  const navigate = useNavigate();

  /** Which phrase the hero is showing; the columns follow it. */
  const [phraseIndex, setPhraseIndex] = useState(0);
  /* A constantly-animating page is hostile to anyone who asked for less of it. */
  const [animate] = useState(
    () => !Capacitor.isNativePlatform() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!animate) {
      document.querySelectorAll<HTMLElement>(".typing").forEach((el) => {
        el.textContent = PHRASES[0];
      });
      document.querySelectorAll<HTMLElement>(".text-landing").forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    new TxtAnime(".typing", {
      effect: "txt-an-7",
      delay: 0.05,
      duration: 0.07,
      repeat: true,
      text: PHRASES,
    });
  }, [animate]);

  /*
   * Drive the columns off the hero's own state rather than a second timer.
   *
   * The effect does not type text in: a phrase appears complete, holds for
   * about three seconds, then erases one character at a time by setting
   * display:none from the end. "Complete" means every character span is
   * still displayed.
   *
   * The words fade out in lockstep with that erase -- opacity is set directly
   * to the fraction of the phrase still visible above, on every character, so
   * the two are the same motion rather than two motions timed to line up.
   * Only the landing side, once the next phrase is fully up, gets an eased
   * transition, since that appearance is instant rather than gradual and
   * needs its own animation to read as a reveal.
   */
  useEffect(() => {
    if (!animate) return;
    const hero = document.querySelector<HTMLElement>(".typing");
    if (!hero) return;

    let revealTimer: number | undefined;
    // Guards re-arming the reveal timer on every incidental mutation while a
    // phrase already sits fully up.
    let phraseIsUp = false;

    const setWordsOpacity = (value: number, eased: boolean) => {
      document.querySelectorAll<HTMLElement>(".text-landing").forEach((el) => {
        el.style.transition = eased ? "opacity 0.35s ease" : "none";
        el.style.opacity = String(value);
      });
    };

    const sync = () => {
      const characters = Array.from(
        hero.querySelectorAll<HTMLElement>("span")
      ).filter((span) => span.children.length === 0);

      if (characters.length === 0) {
        /*
         * Between phrases. TxtAnime hides its last character and clears the
         * element in the same tick, so the ratio below never actually lands
         * on the ratio 0/16 -- it stalls around 1/16 -- and this is the only
         * point that reliably is a true, full disappear.
         */
        window.clearTimeout(revealTimer);
        phraseIsUp = false;
        setWordsOpacity(0, false);
        return;
      }

      const visibleCount = characters.filter(
        (span) => span.style.display !== "none"
      ).length;
      const complete = visibleCount === characters.length;

      if (!complete) {
        window.clearTimeout(revealTimer);
        phraseIsUp = false;
        setWordsOpacity(visibleCount / characters.length, false);
        return;
      }

      if (phraseIsUp) return;
      phraseIsUp = true;

      /*
       * Read which phrase this is now, but do not touch the DOM with it yet.
       * Swapping the sample content here, the instant the phrase completes,
       * left the new words sitting in the page for the whole reveal delay --
       * invisible in principle, but it is what made the columns read as
       * loading in before the phrase above had actually finished. Content
       * and reveal now change in the same step, once, when the delay fires.
       */
      const shown = (hero.textContent ?? "").trim();
      const index = PHRASES.indexOf(shown);

      revealTimer = window.setTimeout(() => {
        if (index >= 0) setPhraseIndex(index);
        setWordsOpacity(1, true);
      }, REVEAL_DELAY_MS);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(hero, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      window.clearTimeout(revealTimer);
    };
  }, [animate]);

  if (Capacitor.isNativePlatform()) {
    // The app opens on the work, not the pitch.
    return <Navigate to={loggedIn ? "/notes" : "/login"} replace />;
  }

  const headword = HEADWORDS[phraseIndex];

  return (
    <div className="flex min-h-full flex-col">
      {/* ---- Masthead ---- */}
      <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-10 md:py-5">
        <Link to="/" className="mr-auto text-[22px] font-extrabold tracking-[-0.02em]">RhymePage</Link>
        {loggedIn ? (
          <Link to="/notes" className="rp-btn rp-btn--ink rp-btn--sm">Open notebook</Link>
        ) : (
          <>
            <Link to="/login" className="rp-btn rp-btn--quiet rp-btn--sm">Sign in</Link>
            <Link to="/register" className="rp-btn rp-btn--ink rp-btn--sm hidden sm:inline-flex">Create account</Link>
          </>
        )}
      </header>

      {/* ---- The pitch, in a song-header card ---- */}
      <section className="mx-auto w-full max-w-6xl px-3 md:px-10">
        <div className="rounded-[32px] bg-accent px-6 pt-8 pb-8 text-on-accent md:px-12 md:pt-14 md:pb-14">
          <h1 className="rp-title max-w-[15ch] text-[40px] md:text-[72px]">
            Finish a word. The next one is waiting.
          </h1>
          <p className="mt-4 max-w-[42ch] text-lg font-medium leading-relaxed md:text-xl">
            RhymePage is a lyric notebook. Every word you finish brings back rhymes, sound-alikes and related words, ready to tap into the line.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {loggedIn ? (
              <button type="button" className="rp-btn bg-on-accent text-accent" onClick={() => navigate("/notes/new")}>
                Start writing
              </button>
            ) : (
              <>
                <button type="button" className="rp-btn bg-on-accent text-accent" onClick={() => navigate("/notes/new")}>
                  Try the editor
                </button>
                <button type="button" className="rp-btn border-on-accent/60 text-on-accent hover:bg-on-accent/15" onClick={() => navigate("/register")}>
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---- Live demo: the typed line and the words that answer it ---- */}
      <section aria-label="How suggestions work" className="mx-auto w-full max-w-6xl px-3 pt-4 md:px-10 md:pt-6">
        <div className="rp-card px-5 pt-6 pb-6 md:px-10 md:pt-9 md:pb-9">
          <p className="typing min-h-[1.15em] text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] md:text-[56px]" />
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-landing text-xl font-extrabold">{headword}</p>
            <p className="rp-muted text-sm">Real results for the last word</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-x-3 md:gap-x-6 lg:grid-cols-6">
            {COLUMNS.map(({ label, category, secondary, samples }) => (
              <div key={label} className={secondary ? "hidden lg:block" : ""}>
                <h3
                  className="inline-flex max-w-full truncate rounded-full px-3 py-1 text-[13px] font-bold text-white"
                  style={{ background: `var(--cat-${category})` }}
                >
                  {label}
                </h3>
                <p className="text-landing landing-sample mt-3 text-[15px] md:text-base">
                  {samples[phraseIndex]
                    .split(" ")
                    .slice(0, WORDS_PER_SAMPLE)
                    .map((word, i) => (
                      <span key={word} className={i < 3 ? "font-bold" : i < 6 ? "font-medium" : "text-ink-2"}>{word}</span>
                    ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- What else lives in the notebook ---- */}
      <section aria-label="What RhymePage keeps together" className="mx-auto w-full max-w-6xl px-3 pt-14 pb-16 md:px-10 md:pt-20 md:pb-24">
        <h2 className="rp-title px-2 text-[28px] md:px-0 md:text-[40px]">One place for the whole song</h2>
        <dl className="rp-card mt-6 divide-y divide-rule px-5 md:px-8">
          {FEATURES.map(({ title, body }) => (
            <div key={title} className="grid gap-1 py-5 md:grid-cols-[18rem_1fr] md:gap-8 md:py-6">
              <dt className="text-lg font-bold">{title}</dt>
              <dd className="rp-muted max-w-[60ch] text-[16px] leading-relaxed">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="panel mt-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm md:px-10">
          <p className="mr-auto font-extrabold">RhymePage</p>
          <Link className="rp-link" to="/privacy">Privacy</Link>
          <Link className="rp-link" to="/delete-account">Delete account</Link>
          <p className="rp-muted w-full text-xs md:w-auto">© {new Date().getFullYear()} RhymePage.com · Suggestions from Datamuse</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
