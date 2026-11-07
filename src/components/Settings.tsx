import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { LuCheck, LuChevronDown, LuChevronRight, LuLogOut } from "react-icons/lu";
import {
  DEFAULT_RHYME_SETTINGS,
  coerceSettings,
  type RhymeSettings,
} from "../types/settings";
import type { RelationKey, ThemeEngine } from "../utils/rhymeApi";
import type { AppUser } from "../types/user";
import { THEMES, type ThemeChoice, type ThemeInfo } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";
import SettingsDashboard from "./SettingsDashboard";
import SettingsProfile from "./SettingsProfile";

interface SettingsProps {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  onLogout: () => void;
}

/** Sections a link can jump to with ?section=… (the deletion page links to "account"). */
const SECTION_IDS = ["profile", "appearance", "suggestions", "account", "about"] as const;

function initials(name: string | null | undefined): string {
  const parts = (name ?? "").match(/\b\w/g) ?? [];
  return ((parts.shift() ?? "") + (parts.pop() ?? "")).toUpperCase() || "?";
}

/* ---------- Appearance ---------- */

const DAY = THEMES.find((t) => t.id === "coral")!.swatch;
const NIGHT = THEMES.find((t) => t.id === "night")!.swatch;

interface ThemeOption {
  id: ThemeChoice;
  label: string;
  note?: string;
  theme?: ThemeInfo;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: "auto", label: "Auto", note: "Match device" },
  ...THEMES.map((theme) => ({
    id: theme.id,
    label: theme.label,
    note: theme.dark ? "Dark" : undefined,
    theme,
  })),
];

/** A 44px chip of the theme: its ground, "Aa" in its ink, and its accent along the foot. */
const Swatch = ({ option, selected }: { option: ThemeOption; selected: boolean }) => {
  const frame = [
    "relative h-11 w-11 flex-none overflow-hidden rounded-2xl border border-rule",
    selected ? "outline-2 outline-offset-2 outline-accent-text" : "",
  ].join(" ");

  if (!option.theme) {
    // Auto: Coral by day, Night after dark, split on the diagonal.
    return (
      <span aria-hidden className={frame} style={{ background: NIGHT[0] }}>
        <span
          className="absolute inset-0"
          style={{ background: DAY[0], clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
        <span className="absolute top-0.5 left-1 text-[14px] font-bold" style={{ color: DAY[1] }}>A</span>
        <span className="absolute right-1 bottom-1.5 text-[14px] font-bold" style={{ color: NIGHT[1] }}>a</span>
        <span className="absolute inset-x-0 bottom-0 flex h-2">
          <span className="flex-1" style={{ background: DAY[2] }} />
          <span className="flex-1" style={{ background: NIGHT[2] }} />
        </span>
      </span>
    );
  }

  const [sleeve, ink, accent] = option.theme.swatch;
  return (
    <span aria-hidden className={frame} style={{ background: sleeve }}>
      <span
        className="absolute inset-x-0 top-0 bottom-2 flex items-center justify-center text-[15px] font-bold"
        style={{ color: ink }}
      >
        Aa
      </span>
      <span className="absolute inset-x-0 bottom-0 h-2" style={{ background: accent }} />
    </span>
  );
};

/**
 * Theme dropdown: the current theme's swatch and name on a single row that
 * opens a list of every theme. Changes apply the moment one is picked.
 */
const ThemePicker = () => {
  const { choice, setChoice } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const current = THEME_OPTIONS.find((option) => option.id === choice) ?? THEME_OPTIONS[0];
  const currentIndex = THEME_OPTIONS.indexOf(current);

  useEffect(() => {
    if (!open) return;
    items.current[currentIndex]?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, currentIndex]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const pick = (id: ThemeChoice) => {
    setChoice(id);
    close();
  };

  const onListKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = THEME_OPTIONS.length - 1;
    const move = (to: number) => {
      event.preventDefault();
      items.current[to]?.focus();
    };
    switch (event.key) {
      case "ArrowDown": return move(index === last ? 0 : index + 1);
      case "ArrowUp": return move(index === 0 ? last : index - 1);
      case "Home": return move(0);
      case "End": return move(last);
      case "Escape":
      case "Tab":
        event.preventDefault();
        return close();
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-[1.5px] border-rule bg-surface px-3 py-2 text-left transition-colors hover:border-ink-2"
      >
        <Swatch option={current} selected={false} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold">{current.label}</span>
          {current.note && <span className="rp-muted block text-[13px]">{current.note}</span>}
        </span>
        <LuChevronDown aria-hidden className={`h-5 w-5 flex-none text-ink-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" aria-label="Theme" className="rp-menu absolute inset-x-0 top-full z-30 mt-2 max-h-[22rem] overflow-y-auto">
          {THEME_OPTIONS.map((option, index) => {
            const selected = option.id === choice;
            return (
              <button
                key={option.id}
                ref={(el) => {
                  items.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(option.id)}
                onKeyDown={(event) => onListKey(event, index)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-sleeve-2 focus-visible:bg-sleeve-2"
              >
                <Swatch option={option} selected={selected} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{option.label}</span>
                  {option.note && <span className="rp-muted block text-[13px]">{option.note}</span>}
                </span>
                {selected && <LuCheck aria-hidden className="h-5 w-5 flex-none text-accent-text" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------- Page ---------- */

/** A top-level group of settings: its own heading, then one or more cards. */
const Group = ({ id, title, blurb, children }: { id: string; title: string; blurb: string; children: ReactNode }) => (
  <section id={`settings-group-${id}`} aria-labelledby={`settings-group-${id}-title`} className="mt-10 scroll-mt-4 first-of-type:mt-6">
    <h2 id={`settings-group-${id}-title`} className="rp-title text-[26px] md:text-[30px]">{title}</h2>
    <p className="rp-muted mt-1 text-[15px]">{blurb}</p>
    <div className="mt-4 flex flex-col gap-4">{children}</div>
  </section>
);

const Section = ({ id, title, children }: { id: (typeof SECTION_IDS)[number]; title: string; children: ReactNode }) => (
  <section id={`settings-${id}`} aria-labelledby={`settings-${id}-title`} className="rp-card scroll-mt-4 p-5 md:p-6">
    <h3 id={`settings-${id}-title`} className="text-lg font-bold">{title}</h3>
    <div className="mt-3">{children}</div>
  </section>
);

const GROUPS = [
  { id: "engine", label: "Rhyme engine" },
  { id: "profile", label: "Profile & account" },
  { id: "app", label: "App" },
] as const;

const Settings = ({ currentUser, setCurrentUser, onLogout }: SettingsProps) => {
  const [settings, setSettings] = useState<RhymeSettings>(DEFAULT_RHYME_SETTINGS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const navigate = useNavigate();
  const db = getFirestore();
  const signedIn = Boolean(currentUser);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (cancelled || !snap.exists()) return;
        setSettings(coerceSettings(snap.data().settings));
      } catch {
        // Keep the defaults on screen if the document can't be read.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, db, navigate]);

  // Everything is on one page now; ?section=account scrolls to that section.
  useEffect(() => {
    if (!signedIn) return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (!section || !(SECTION_IDS as readonly string[]).includes(section)) return;
    document.getElementById(`settings-${section}`)?.scrollIntoView({ block: "start" });
  }, [signedIn]);

  const toggle = (key: RelationKey) => {
    setStatus("idle");
    setSettings((prev) => ({
      ...prev,
      enabled: { ...prev.enabled, [key]: !prev.enabled[key] },
    }));
  };

  const setEngine = (engine: ThemeEngine) => {
    setStatus("idle");
    setSettings((prev) => ({ ...prev, engine }));
  };

  const setMax = (max: number) => {
    setStatus("idle");
    setSettings((prev) => ({ ...prev, max }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setStatus("saving");
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        { settings },
        { merge: true }
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-10 md:px-10 md:pt-10">
      <h1 className="rp-title text-[34px] md:text-[44px]">Settings</h1>
      <nav aria-label="Settings sections" className="no-bar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {GROUPS.map(({ id, label }) => (
          <a key={id} href={`#settings-group-${id}`} className="rp-tag !h-9 flex-none !px-4 !text-[14px] hover:text-ink">{label}</a>
        ))}
      </nav>

      <Group id="engine" title="Rhyme engine" blurb="What the suggestion sheet looks up when you finish a word.">
        <Section id="suggestions" title="Suggestions">
            <SettingsDashboard
              settings={settings}
              onToggle={toggle}
              onEngineChange={setEngine}
              onMaxChange={setMax}
              onSave={handleSave}
              status={status}
            />
        </Section>
      </Group>

      <Group id="profile" title="Profile & account" blurb="Who you are on RhymePage and how you sign in.">
        <Section id="profile" title="Your profile">
          <Link
            to="/profile"
            className="group -mx-2 flex min-h-16 items-center gap-4 rounded-2xl px-2 py-2 transition-colors hover:bg-sleeve-2"
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-accent text-[15px] font-bold text-on-accent">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(currentUser.displayName)
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-semibold">
                {currentUser.displayName || "Your profile"}
              </span>
              {currentUser.email && (
                <span className="rp-muted block truncate text-[15px]">{currentUser.email}</span>
              )}
            </span>
            <span className="rp-label hidden sm:inline">View profile</span>
            <LuChevronRight aria-hidden className="h-5 w-5 flex-none text-ink-2 group-hover:text-ink" />
          </Link>
        </Section>

        <Section id="account" title="Account">
          <SettingsProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />
        </Section>
      </Group>

      <Group id="app" title="App" blurb="How RhymePage looks on this device, and the fine print.">
        <Section id="appearance" title="Theme">
          <ThemePicker />
        </Section>

        <Section id="about" title="About">
          <ul className="flex flex-col text-[15px]">
            <li className="flex min-h-11 items-center">
              <Link to="/privacy" className="rp-link">Privacy policy</Link>
            </li>
            <li className="flex min-h-11 items-center">
              <Link to="/delete-account" className="rp-link">Delete account</Link>
            </li>
          </ul>
          <button type="button" className="rp-btn rp-btn--line mt-6" onClick={onLogout}>
            <LuLogOut aria-hidden /> Sign out
          </button>
        </Section>
      </Group>
    </div>
  );
};

export default Settings;
