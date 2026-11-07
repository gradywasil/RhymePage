import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { LuLogIn, LuLogOut, LuNotebook, LuPenLine, LuSettings } from "react-icons/lu";
import type { AppUser } from "../../types/user";

interface AppShellProps {
  currentUser: AppUser | null;
  onLogout: () => void;
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  isActive: (pathname: string) => boolean;
}

const isEditor = (p: string) => p.startsWith("/notes/");

const SIGNED_IN: NavItem[] = [
  { to: "/notes/new", label: "Write", icon: LuPenLine, isActive: isEditor },
  { to: "/notes", label: "Notebook", icon: LuNotebook, isActive: (p) => p === "/notes" },
  { to: "/settings", label: "Settings", icon: LuSettings, isActive: (p) => p.startsWith("/settings") || p.startsWith("/profile") },
];

const GUEST: NavItem[] = [
  { to: "/notes/new", label: "Write", icon: LuPenLine, isActive: isEditor },
  { to: "/login", label: "Sign in", icon: LuLogIn, isActive: (p) => p === "/login" || p === "/register" },
];

function initials(name: string | null | undefined): string {
  const parts = (name ?? "").match(/\b\w/g) ?? [];
  return ((parts.shift() ?? "") + (parts.pop() ?? "")).toUpperCase() || "?";
}

/**
 * While a phone keyboard is up, the tab bar would ride above it and steal a
 * row of lyrics. Hide it whenever something editable has focus on a touch
 * screen; it returns the moment focus leaves.
 */
function useTyping(): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia?.("(pointer: coarse)");
    const editable = (el: Element | null) =>
      !!el && (el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLInputElement && !["checkbox", "radio", "range", "button", "submit", "file"].includes(el.type)) ||
        (el as HTMLElement).isContentEditable);
    const sync = () => setTyping(!!coarse?.matches && editable(document.activeElement));
    // Focus moves to the next element after focusout, so read it a frame later.
    const syncLater = () => requestAnimationFrame(sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", syncLater);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", syncLater);
    };
  }, []);
  return typing;
}

const Avatar = ({ user }: { user: AppUser }) => (
  <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden bg-panel-2 text-[13px] font-bold text-on-panel">
    {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : initials(user.displayName)}
  </span>
);

const AppShell = ({ currentUser, onLogout, children }: AppShellProps) => {
  const { pathname } = useLocation();
  const typing = useTyping();
  const items = currentUser ? SIGNED_IN : GUEST;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* ---- Desktop rail ---- */}
      <nav aria-label="Main" className="panel hidden w-56 flex-none flex-col md:flex lg:w-60">
        <Link to="/" className="mx-3 mt-4 mb-6 px-2 py-1 text-[22px] font-extrabold tracking-[-0.02em]">
          RhymePage
        </Link>
        <ul className="flex flex-col gap-0.5 px-3">
          {items.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center gap-3 px-3 text-[15px] font-semibold transition-colors",
                    active ? "bg-panel-2 text-on-panel" : "text-on-panel-2 hover:bg-panel-2 hover:text-on-panel",
                  ].join(" ")}
                >
                  <Icon className={["h-[18px] w-[18px]", active ? "text-panel-accent" : ""].join(" ")} aria-hidden />
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex flex-col gap-3 border-t border-panel-rule px-5 py-4">
          {currentUser ? (
            <>
              <Link to="/profile" className="flex min-w-0 items-center gap-3 hover:text-on-panel">
                <Avatar user={currentUser} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{currentUser.displayName || "Your profile"}</span>
                  <span className="block truncate text-xs text-on-panel-2">{currentUser.email}</span>
                </span>
              </Link>
              <button type="button" onClick={onLogout} className="rp-btn rp-btn--quiet rp-btn--sm -mx-3 justify-start">
                <LuLogOut aria-hidden /> Sign out
              </button>
            </>
          ) : (
            <Link to="/register" className="rp-btn rp-btn--line rp-btn--sm">Create account</Link>
          )}
          <p className="flex gap-4 text-xs text-on-panel-2">
            <Link className="rp-link hover:text-on-panel" to="/privacy">Privacy</Link>
            <Link className="rp-link hover:text-on-panel" to="/delete-account">Delete account</Link>
          </p>
        </div>
      </nav>

      {/* ---- Page ---- */}
      <main id="main" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>

      {/* ---- Phone tab bar ---- */}
      <nav
        aria-label="Main"
        hidden={typing}
        className="app-tabbar panel flex-none border-t border-panel-rule md:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-[58px] flex-col items-center justify-center gap-1 text-xs font-semibold",
                    active ? "text-on-panel" : "text-on-panel-2",
                  ].join(" ")}
                >
                  <Icon className={["h-[22px] w-[22px]", active ? "text-panel-accent" : ""].join(" ")} aria-hidden />
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AppShell;
