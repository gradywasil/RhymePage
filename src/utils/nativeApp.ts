import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle, SystemBarType, type PluginListenerHandle } from "@capacitor/core";

export const isAndroid = () => Capacitor.getPlatform() === "android";
export const isIOS = () => Capacitor.getPlatform() === "ios";
/** Running inside the Android or iOS app shell rather than a browser. */
export const isNativeApp = () => Capacitor.isNativePlatform();

export function updateSystemBarContrast() {
  if (!Capacitor.isNativePlatform()) return;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return;
  const styled = new Set<SystemBarType>();
  for (const [bar, selector] of [[SystemBarType.StatusBar, "[data-statusbar-surface]"], [SystemBarType.NavigationBar, ".app-tabbar:not([hidden])"], [SystemBarType.NavigationBar, ".app-frame"]] as const) {
    if (styled.has(bar)) continue;
    // iOS has no navigation bar to style; only the status bar text follows the sleeve.
    if (bar === SystemBarType.NavigationBar && !isAndroid()) continue;
    const surface = document.querySelector(selector) ?? (bar === SystemBarType.StatusBar ? document.querySelector(".app-frame") : null);
    if (!surface) continue;
    styled.add(bar);
    context.fillStyle = getComputedStyle(surface).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    const style = .2126 * r + .7152 * g + .0722 * b > .179 ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
    void SystemBars.setStyle({ bar, style }).catch(() => undefined);
  }
}

export const nativeApp = registerPlugin<{
  getGoogleCredential(): Promise<{ idToken: string }>;
  /** iOS only. `nonce` is the raw value whose SHA-256 Apple embedded in the token. */
  getAppleCredential(): Promise<{ idToken: string; nonce: string; authorizationCode?: string; givenName?: string; familyName?: string }>;
  clearGoogleSession(): Promise<void>;
  openSettings(): Promise<void>;
  background(): Promise<void>;
  loadRecovery(options: { seed: Record<string, string> }): Promise<{ entries: Record<string, string> }>;
  writeRecovery(options: { key: string; value: string | null }): Promise<void>;
  exportText(options: { filename: string; content: string; mimeType: string }): Promise<{ saved: boolean }>;
  addListener(event: "backButton", listener: () => void): Promise<PluginListenerHandle>;
}>("RhymePage");

export async function clearNativeGoogleSession() {
  if (isAndroid()) await nativeApp.clearGoogleSession().catch(() => undefined);
}
