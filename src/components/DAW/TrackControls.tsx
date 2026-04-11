"use client";

import { useRef } from "react";
import type { Track } from "@/types";

interface TrackControlsProps {
  track: Track;
  index: number;
  height: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  onVolumeChange: (vol: number) => void;
  onPanChange: (pan: number) => void;
  onMute: () => void;
  onSolo: () => void;
  onUpload?: (file: File) => void;
  onRecord?: () => void;
  recording?: boolean;
  onFx?: () => void;
  fxActive?: boolean;
  onDelete?: () => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  isOwner: boolean;
}

const INSTRUMENT_COLORS: Record<string, string> = {
  Bass: "#3b82f6", AGuitar: "#ef4444", EGuitar: "#f97316", Drums: "#eab308",
  Harp: "#8b5cf6", Flute: "#ec4899", Percussion: "#f59e0b", Piano: "#7c3aed",
  Saxophone: "#ea580c", Triangle: "#06b6d4", Violine: "#d946ef", Vocals: "#10b981",
};

export function TrackControls({
  track, index, height, volume, pan, muted, solo,
  onVolumeChange, onPanChange, onMute, onSolo,
  onUpload, onRecord, recording, onFx, fxActive, onDelete,
  onDragStart, onDragOver, onDragEnd, isDragOver, isOwner,
}: TrackControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const color = INSTRUMENT_COLORS[track.instrument] ?? "#6b7280";

  return (
    <div
      className={`flex items-stretch border-b transition-colors ${
        isDragOver ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800/30 bg-zinc-900/60"
      }`}
      style={{ height }}
      draggable={!!onDragStart}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(); }}
      onDragEnd={() => onDragEnd?.()}
    >
      {/* Color bar */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="flex flex-col justify-between py-2 px-2.5 flex-1 min-w-0">
        {/* Top: drag handle + name + number + delete */}
        <div className="flex items-center gap-1.5">
          {onDragStart && (
            <div className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500 transition flex-shrink-0">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="currentColor">
                <circle cx="1.5" cy="1.5" r="1"/><circle cx="5.5" cy="1.5" r="1"/>
                <circle cx="1.5" cy="6" r="1"/><circle cx="5.5" cy="6" r="1"/>
                <circle cx="1.5" cy="10.5" r="1"/><circle cx="5.5" cy="10.5" r="1"/>
              </svg>
            </div>
          )}
          <span className="text-[9px] text-zinc-600 font-mono w-3 flex-shrink-0">{index + 1}</span>
          <span className="text-[11px] font-semibold text-zinc-200 truncate">{track.instrument}</span>
          <span className="text-[8px] ml-0.5 flex-shrink-0">
            {track.status === "uploaded" ? (
              <span className="text-emerald-500">&#9679;</span>
            ) : track.status === "editing" ? (
              <span className="text-amber-500">&#9679;</span>
            ) : (
              <span className="text-zinc-600">&#9675;</span>
            )}
          </span>
          {isOwner && onDelete && (
            <button onClick={onDelete} className="ml-auto w-4 h-4 flex items-center justify-center text-zinc-700 hover:text-red-400 transition flex-shrink-0" title="Delete">
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          )}
        </div>

        {/* Middle: M S FX buttons */}
        <div className="flex items-center gap-1">
          <button onClick={onMute} className={`px-1.5 h-[18px] text-[9px] font-bold rounded-sm transition ${muted ? "bg-red-500 text-white" : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-200"}`}>M</button>
          <button onClick={onSolo} className={`px-1.5 h-[18px] text-[9px] font-bold rounded-sm transition ${solo ? "bg-amber-500 text-black" : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-200"}`}>S</button>
          {onFx && (
            <button onClick={onFx} className={`px-1.5 h-[18px] text-[8px] font-bold rounded-sm transition ${fxActive ? "bg-purple-500 text-white" : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-200"}`}>FX</button>
          )}

          {/* Actions: record + upload */}
          <div className="flex items-center gap-0.5 ml-auto">
            {isOwner && track.status !== "uploaded" && onRecord && (
              <button onClick={onRecord} className={`w-[18px] h-[18px] flex items-center justify-center rounded-sm transition ${recording ? "bg-red-500 animate-pulse" : "bg-zinc-800/80 hover:bg-zinc-700"}`} title={recording ? "Stop" : "Rec"}>
                <div className={`rounded-full ${recording ? "w-1.5 h-1.5 bg-white" : "w-2 h-2 bg-red-400"}`}/>
              </button>
            )}
            {isOwner && track.status !== "uploaded" && onUpload && (
              <>
                <input ref={fileRef} type="file" accept="audio/*" onChange={() => { if (fileRef.current?.files?.[0]) onUpload(fileRef.current.files[0]); }} className="hidden"/>
                <button onClick={() => fileRef.current?.click()} className="w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-zinc-800/80 hover:bg-blue-600 transition text-zinc-400 hover:text-white" title="Upload">
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l4 4h-3v5H7V6H4l4-4zM2 12h12v2H2z"/></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom: Volume + Pan */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-zinc-600 w-5">Vol</span>
          <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="flex-1 h-[3px] accent-emerald-500 cursor-pointer" title={`${Math.round(volume * 100)}%`}/>
          <span className="text-[8px] text-zinc-600 w-5 text-right">{Math.round(volume * 100)}</span>
          <div className="w-px h-3 bg-zinc-800 mx-0.5"/>
          <span className="text-[8px] text-zinc-600 w-5">Pan</span>
          <input type="range" min={-100} max={100} value={Math.round(pan * 100)} onChange={(e) => onPanChange(Number(e.target.value) / 100)}
            className="w-10 h-[3px] accent-blue-500 cursor-pointer" title={pan === 0 ? "C" : pan > 0 ? `R${Math.round(pan * 100)}` : `L${Math.round(Math.abs(pan) * 100)}`}/>
          <span className="text-[8px] text-zinc-600 w-3">{pan === 0 ? "C" : pan > 0 ? "R" : "L"}</span>
        </div>
      </div>
    </div>
  );
}
