import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle, SystemBarType, type PluginListenerHandle } from "@capacitor/core";

export const isAndroid = () => Capacitor.getPlatform() === "android";

export function updateSystemBarContrast() {
  if (!isAndroid()) return;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return;
  for (const [bar, selector] of [[SystemBarType.StatusBar, ".app-frame"], [SystemBarType.NavigationBar, ".app-footer, .app-frame[data-writing='true']"]] as const) {
    const surface = document.querySelector(selector);
    if (!surface) continue;
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
