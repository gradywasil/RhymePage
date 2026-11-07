import { useEffect, useRef, useState, type RefObject } from "react";
import { LuPause, LuPlay } from "react-icons/lu";
import type WaveSurfer from "wavesurfer.js";
import type RegionsPluginType from "wavesurfer.js/dist/plugins/regions.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions.js";
import type { SyncDoc } from "../types/sync";

interface WaveformEditorProps {
  syncDoc: SyncDoc;
  /**
   * The same `<audio>` element `useSyncLogic` owns, passed as a ref rather
   * than its dereferenced value -- reading `.current` happens inside this
   * component's own effect, not during either component's render.
   */
  audioRef: RefObject<HTMLAudioElement | null>;
  onLineTimingChange: (lineId: string, start: number, end: number) => void;
}

const MIN_PX_PER_SEC = 20;
const MAX_PX_PER_SEC = 500;
const DEFAULT_PX_PER_SEC = 80;

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

/**
 * The waveform's colours, read straight off the active theme's roles in
 * tokens.css: the wave in second ink (the rule colour is too faint to read as
 * data), the played portion in the printed accent, the cursor in ink.
 */
function readThemeColors(): { waveColor?: string; progressColor?: string; cursorColor?: string } {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim() || undefined;
  return {
    waveColor: read("--ink-2"),
    progressColor: read("--accent-text"),
    cursorColor: read("--ink"),
  };
}

/**
 * Fine-tunes line timing by dragging/resizing regions on a waveform. Reuses
 * the same `<audio>` element `useSyncLogic` already owns (via wavesurfer's
 * `media` option) rather than creating a second one, so this can sit
 * alongside the fast-sync capture UI without fighting over playback.
 */
const WaveformEditor = ({ syncDoc, audioRef, onLineTimingChange }: WaveformEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPluginType | null>(null);
  const lastSnapshotRef = useRef<string | null>(null);
  const onLineTimingChangeRef = useRef(onLineTimingChange);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_PX_PER_SEC);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    onLineTimingChangeRef.current = onLineTimingChange;
  }, [onLineTimingChange]);

  // Create the wavesurfer instance once an audio element exists. Colors are
  // read off the theme's CSS custom properties rather than hardcoding a
  // palette, and re-read whenever `data-theme` on <html> changes, so the
  // waveform follows a theme switch without being rebuilt.
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!containerRef.current || !audioEl) return;
    let cancelled = false;
    let themeObserver: MutationObserver | null = null;

    (async () => {
      try {
        const [{ default: WaveSurferCtor }, { default: RegionsPluginCtor }] =
          await Promise.all([
            import("wavesurfer.js"),
            import("wavesurfer.js/dist/plugins/regions.js"),
          ]);
        if (cancelled || !containerRef.current) return;

        const ws = WaveSurferCtor.create({
          container: containerRef.current,
          media: audioEl,
          height: 96,
          minPxPerSec: DEFAULT_PX_PER_SEC,
          ...readThemeColors(),
        });

        themeObserver = new MutationObserver(() => ws.setOptions(readThemeColors()));
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });
        const regions = ws.registerPlugin(RegionsPluginCtor.create());

        regions.on("region-updated", (region: Region) => {
          onLineTimingChangeRef.current(region.id, region.start, region.end);
        });
        regions.on("region-clicked", (region: Region, e: MouseEvent) => {
          e.stopPropagation();
          setSelectedLineId(region.id);
          ws.setTime(region.start);
        });

        ws.on("ready", () => setReady(true));
        ws.on("error", () => setLoadError(true));
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("timeupdate", (time) => setCurrentTime(time));

        wavesurferRef.current = ws;
        regionsRef.current = regions;
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      themeObserver = null;
      regionsRef.current = null;
      // Safe against the shared `audioEl`: destroy() doesn't touch an
      // externally-provided media element, only wavesurfer's own DOM/state.
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
      setReady(false);
    };
  }, [audioRef]);

  // Rebuild regions only when the lyrics themselves changed (a reconciliation
  // ran and line identities may have shifted) -- not on every syncDoc update,
  // so a write this editor just made doesn't fight its own in-progress drag.
  useEffect(() => {
    const regions = regionsRef.current;
    if (!ready || !regions) return;
    if (lastSnapshotRef.current === syncDoc.lyricsSnapshot) return;
    lastSnapshotRef.current = syncDoc.lyricsSnapshot;

    regions.clearRegions();
    for (const lineId of syncDoc.lineOrder) {
      const line = syncDoc.lines[lineId];
      if (line.start === null || line.end === null) continue;
      regions.addRegion({
        id: lineId,
        start: line.start,
        end: line.end,
        content: line.text,
        drag: true,
        resize: true,
      });
    }
  }, [ready, syncDoc]);

  const handleZoom = (value: number) => {
    setZoomLevel(value);
    wavesurferRef.current?.zoom(value);
  };

  const hasTimedLines = syncDoc.lineOrder.some(
    (lineId) => syncDoc.lines[lineId]?.start !== null
  );
  const selectedLine = selectedLineId ? syncDoc.lines[selectedLineId] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {loadError && (
        <p role="alert" className="rp-message rp-message--danger">Couldn't load the waveform for this audio.</p>
      )}

      {!hasTimedLines && (
        <p className="rp-hint">
          No marked lines yet -- use Fast Sync first, then fine-tune the timing here.
        </p>
      )}

      <div
        ref={containerRef}
        className="w-full flex-none overflow-hidden rounded-3xl bg-surface px-2"
      />

      {selectedLine && (
        <p className="flex items-baseline gap-3 text-[15px]">
          <span className="flex-none text-[13px] font-semibold tabular-nums text-accent-text">
            {formatSeconds(selectedLine.start ?? 0)}
            <span className="font-normal text-ink-2"> to {formatSeconds(selectedLine.end ?? 0)}</span>
          </span>
          <span className="min-w-0 truncate font-semibold">{selectedLine.text}</span>
        </p>
      )}

      <div className="flex flex-none items-center gap-3">
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink text-sleeve transition-colors duration-150 ease-out hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          disabled={!ready}
          onClick={() => void wavesurferRef.current?.playPause().catch(() => setLoadError(true))}
        >
          {isPlaying ? <LuPause aria-hidden className="h-5 w-5" /> : <LuPlay aria-hidden className="h-5 w-5" />}
        </button>
        <span className="w-16 flex-none text-[13px] font-semibold tabular-nums text-accent-text">
          {formatSeconds(currentTime)}
        </span>
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="rp-label">Zoom</span>
          <input
            type="range"
            min={MIN_PX_PER_SEC}
            max={MAX_PX_PER_SEC}
            value={zoomLevel}
            disabled={!ready}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="rp-range min-w-0 flex-1"
          />
        </label>
      </div>
    </div>
  );
};

export default WaveformEditor;
