"use client";

interface TransportBarProps {
  playing: boolean;
  canPlay: boolean;
  currentTime: number;
  timelineDuration: number;
  bpm: number;
  looping: boolean;
  masterVolume: number;
  uploading: boolean;
  recording: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onMasterVolumeChange: (v: number) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export function TransportBar({
  playing,
  canPlay,
  currentTime,
  timelineDuration,
  bpm,
  looping,
  masterVolume,
  uploading,
  recording,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  onMasterVolumeChange,
}: TransportBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#111113] border-b border-zinc-800/50">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onStop}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          title="Stop [Home]"
        >
          <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
            <rect width="10" height="10" rx="1" />
          </svg>
        </button>
        <button
          onClick={playing ? onPause : onPlay}
          disabled={!canPlay}
          className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all ${
            playing
              ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : !canPlay
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          }`}
          title={`${playing ? "Pause" : "Play"} [Space]`}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="0" width="3" height="12" rx="1" />
              <rect x="8" y="0" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 0.5v11l9-5.5z" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={onToggleLoop}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
          looping
            ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40"
            : "bg-zinc-800 text-zinc-600 hover:text-zinc-300"
        }`}
        title={`Loop ${looping ? "on" : "off"} [L]`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </button>

      <div className="font-mono text-base tabular-nums bg-black/50 px-4 py-2 rounded-lg border border-zinc-800/50">
        <span className="text-emerald-400 font-semibold">{formatTime(currentTime)}</span>
        <span className="text-zinc-700 mx-1">/</span>
        <span className="text-zinc-500">{formatTime(timelineDuration)}</span>
      </div>

      <span className="font-mono text-xs text-orange-400/70 bg-black/30 px-2.5 py-1.5 rounded-lg border border-zinc-800/50 hidden sm:block">
        {bpm} BPM
      </span>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={() => onMasterVolumeChange(masterVolume > 0 ? 0 : 0.8)}
          className="text-zinc-500 hover:text-zinc-300 transition"
          title="Master mute [M]"
        >
          {masterVolume === 0 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(masterVolume * 100)}
          onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-zinc-400 cursor-pointer"
          title={`Master: ${Math.round(masterVolume * 100)}%`}
        />
      </div>

      {(uploading || recording) && (
        <div className="flex items-center gap-2 text-xs">
          {uploading && (
            <span className="flex items-center gap-1 text-blue-400">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              IPFS
            </span>
          )}
          {recording && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { formatTime };
