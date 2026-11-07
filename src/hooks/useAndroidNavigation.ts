import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isAndroid, nativeApp } from "../utils/nativeApp";
import { getRecoveryStorage } from "../utils/recoveryStorage";

export function useAndroidNavigation(uid: string | null, ready: boolean) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const restoredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!isAndroid() || !ready) return;
    const key = `rhymepage:last-route:${uid ?? "guest"}`;
    try {
      if (restoredFor.current !== key) {
        restoredFor.current = key;
        const saved = getRecoveryStorage().getItem(key);
        if (pathname === "/" && saved && /^\/notes\/(new|[a-zA-Z0-9_-]+)$/.test(saved)) {
          navigate(saved, { replace: true });
          return;
        }
      }
      getRecoveryStorage().setItem(key, pathname);
    } catch { /* Draft persistence reports storage failures in the editor. */ }
  }, [uid, ready, pathname, navigate]);

  useEffect(() => {
    if (!isAndroid()) return;
    const handle = nativeApp.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) {
        if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close();
      } else if (pathname === "/") {
        void nativeApp.background();
      } else if (window.history.state?.idx > 0) {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }
    });
    return () => { void handle.then(listener => listener.remove()); };
  }, [pathname, navigate]);
}
