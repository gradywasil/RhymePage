import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { LuCheck, LuChevronDown, LuChevronLeft, LuChevronRight, LuInfo, LuLogOut, LuPalette, LuSparkles, LuUserRound } from "react-icons/lu";
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

type CategoryId = "engine" | "account" | "appearance" | "about";

interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
  icon: IconType;
  /** Suggestion-category colour for the row's icon tile. */
  colour: string;
}

const CATEGORIES: Category[] = [
  { id: "engine", label: "Rhyme engine", blurb: "Categories, theme matching, results", icon: LuSparkles, colour: "rhyme" },
  { id: "account", label: "Account", blurb: "Name, email, password, deletion", icon: LuUserRound, colour: "noun" },
  { id: "appearance", label: "Appearance", blurb: "Theme for this device", icon: LuPalette, colour: "antonym" },
  { id: "about", label: "About", blurb: "Privacy and your data", icon: LuInfo, colour: "synonym" },
];

/** ?section= links from the single-page settings, mapped to their category. */
const LEGACY_SECTIONS: Record<string, CategoryId> = {
  suggestions: "engine",
  profile: "account",
  account: "account",
  appearance: "appearance",
  about: "about",
};

/**
 * Settings opens on a short index of categories; each one opens on its own.
 * On a phone the index and a category are separate screens (with a back
 * link); from md up the index stays on the left and the category on the right.
 */
const Settings = ({ currentUser, setCurrentUser, onLogout }: SettingsProps) => {
  const { section } = useParams<{ section?: string }>();
  const { search } = useLocation();
  const active = CATEGORIES.find((category) => category.id === section);
  // Desktop always shows a category; a phone shows the index until one is picked.
  const shown = active ?? CATEGORIES[0];
  const [settings, setSettings] = useState<RhymeSettings>(DEFAULT_RHYME_SETTINGS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const navigate = useNavigate();
  const db = getFirestore();

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

  const legacy = new URLSearchParams(search).get("section");
  if (!section && legacy && LEGACY_SECTIONS[legacy]) {
    return <Navigate to={`/settings/${LEGACY_SECTIONS[legacy]}`} replace />;
  }
  if (section && !active) return <Navigate to="/settings" replace />;

  const content: Record<CategoryId, ReactNode> = {
    engine: (
      <SettingsDashboard
        settings={settings}
        onToggle={toggle}
        onEngineChange={setEngine}
        onMaxChange={setMax}
        onSave={handleSave}
        status={status}
      />
    ),
    account: <SettingsProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />,
    appearance: (
      <>
        <p className="rp-muted mb-4 text-[15px] leading-relaxed">
          Choose how RhymePage looks on this device. Changes apply right away.
        </p>
        <ThemePicker />
      </>
    ),
    about: (
      <ul className="flex flex-col text-[15px]">
        <li className="flex min-h-11 items-center">
          <Link to="/privacy" className="rp-link">Privacy policy</Link>
        </li>
        <li className="flex min-h-11 items-center">
          <Link to="/delete-account" className="rp-link">How account deletion works</Link>
        </li>
      </ul>
    ),
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-8 px-4 pt-5 pb-10 md:px-10 md:pt-10">
      {/* ---- Index ---- */}
      <div className={`w-full md:w-80 md:flex-none ${active ? "hidden md:block" : ""}`}>
        <h1 className="rp-title text-[34px] md:text-[40px]">Settings</h1>

        <Link
          to="/profile"
          className="rp-card group mt-5 flex min-h-[76px] items-center gap-4 px-4 py-3 transition-shadow hover:shadow-[0_10px_28px_rgb(var(--shadow)/0.14)]"
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-accent text-[15px] font-bold text-on-accent">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(currentUser.displayName)
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-bold">{currentUser.displayName || "Your profile"}</span>
            <span className="rp-muted block truncate text-[14px]">View your profile</span>
          </span>
          <LuChevronRight aria-hidden className="h-5 w-5 flex-none text-ink-2 group-hover:text-ink" />
        </Link>

        <nav aria-label="Settings categories" className="rp-card mt-4 overflow-hidden p-1.5">
          <ul className="flex flex-col">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const current = category.id === shown.id;
              return (
                <li key={category.id}>
                  <Link
                    to={`/settings/${category.id}`}
                    aria-current={active?.id === category.id ? "page" : undefined}
                    className={[
                      "group flex min-h-16 items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-sleeve-2",
                      current ? "md:bg-sleeve-2" : "",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white"
                      style={{ background: `var(--cat-${category.colour})` }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-bold">{category.label}</span>
                      <span className="rp-muted block truncate text-[13px]">{category.blurb}</span>
                    </span>
                    <LuChevronRight aria-hidden className="h-5 w-5 flex-none text-ink-2 group-hover:text-ink md:hidden" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button type="button" className="rp-btn rp-btn--line mt-4 w-full" onClick={onLogout}>
          <LuLogOut aria-hidden /> Sign out
        </button>
      </div>

      {/* ---- The open category ---- */}
      <section
        aria-labelledby="settings-category-title"
        className={`min-w-0 flex-1 ${active ? "" : "hidden md:block"}`}
      >
        <Link to="/settings" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-ink-2 hover:text-ink md:hidden">
          <LuChevronLeft aria-hidden className="h-5 w-5" /> Settings
        </Link>
        <h2 id="settings-category-title" className="rp-title mt-1 text-[30px] md:mt-[5px] md:text-[40px]">{shown.label}</h2>
        <div className="rp-card mt-5 p-5 md:p-6">{content[shown.id]}</div>
      </section>
    </div>
  );
};

export default Settings;
