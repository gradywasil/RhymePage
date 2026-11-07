import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { LuCheck, LuChevronRight, LuLogOut } from "react-icons/lu";
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

const HARBOR = THEMES.find((t) => t.id === "harbor")!.swatch;
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

/** A 40px printing of the theme: sleeve ground, "Aa" in its ink, an accent bar along the foot. */
const Swatch = ({ option, selected }: { option: ThemeOption; selected: boolean }) => {
  const frame = [
    "relative h-10 w-10 flex-none overflow-hidden border border-rule",
    selected ? "outline-[1.5px] outline-offset-2 outline-ink" : "",
  ].join(" ");

  if (!option.theme) {
    // Auto: Harbor by day, Night after dark, split on the diagonal.
    return (
      <span aria-hidden className={frame} style={{ background: NIGHT[0] }}>
        <span
          className="absolute inset-0"
          style={{ background: HARBOR[0], clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
        <span className="absolute top-0.5 left-1 text-[14px] font-bold" style={{ color: HARBOR[1] }}>A</span>
        <span className="absolute right-1 bottom-1.5 text-[14px] font-bold" style={{ color: NIGHT[1] }}>a</span>
        <span className="absolute inset-x-0 bottom-0 flex h-1">
          <span className="flex-1" style={{ background: HARBOR[2] }} />
          <span className="flex-1" style={{ background: NIGHT[2] }} />
        </span>
      </span>
    );
  }

  const [sleeve, ink, accent] = option.theme.swatch;
  return (
    <span aria-hidden className={frame} style={{ background: sleeve }}>
      <span
        className="absolute inset-x-0 top-0 bottom-1 flex items-center justify-center text-[15px] font-bold"
        style={{ color: ink }}
      >
        Aa
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />
    </span>
  );
};

const ThemePicker = () => {
  const { choice, setChoice } = useTheme();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Radio-group keys: arrows move and select, Home/End jump to the ends.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = THEME_OPTIONS.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    setChoice(THEME_OPTIONS[next].id);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-2 gap-x-4 border-y border-rule py-2 md:grid-cols-4"
    >
      {THEME_OPTIONS.map((option, index) => {
        const selected = choice === option.id;
        return (
          <button
            key={option.id}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => setChoice(option.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="flex min-h-16 items-center gap-3 px-1 py-2 text-left transition-colors hover:bg-sleeve-2"
          >
            <Swatch option={option} selected={selected} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{option.label}</span>
              {option.note && <span className="rp-muted block text-[13px]">{option.note}</span>}
            </span>
            {selected && <LuCheck aria-hidden className="h-5 w-5 flex-none" />}
          </button>
        );
      })}
    </div>
  );
};

/* ---------- Page ---------- */

const Section = ({ id, title, children }: { id: (typeof SECTION_IDS)[number]; title: string; children: ReactNode }) => (
  <section id={`settings-${id}`} aria-labelledby={`settings-${id}-title`} className="mt-12 scroll-mt-4 border-t-[1.5px] border-ink pt-4 first-of-type:mt-8">
    <h2 id={`settings-${id}-title`} className="rp-title text-2xl">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

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

      <Section id="profile" title="Profile">
        <Link
          to="/profile"
          className="group -mx-1 flex min-h-16 items-center gap-4 px-1 py-2 transition-colors hover:bg-sleeve-2"
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden bg-sleeve-2 text-[15px] font-bold">
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

      <Section id="appearance" title="Appearance">
        <p className="rp-muted mb-4 text-[15px] leading-relaxed">
          Choose how RhymePage looks on this device. Changes apply right away.
        </p>
        <ThemePicker />
      </Section>

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

      <Section id="account" title="Account">
        <SettingsProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />
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
    </div>
  );
};

export default Settings;
