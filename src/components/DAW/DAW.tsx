"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { TrackControls } from "./TrackControls";
import { useApi } from "@/hooks/useApi";
import { useIpfs } from "@/hooks/useIpfs";
import { useRecorder } from "@/hooks/useRecorder";
import { useMetronome } from "@/hooks/useMetronome";
import { useToast } from "@/components/ui/Toast";
import { TrackEffects, DEFAULT_EFFECTS, type EffectValues } from "./TrackEffects";
import type { Track } from "@/types";

interface TrackState {
  track: Track;
  wavesurfer: WaveSurfer | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

interface DAWProps {
  tracks: Track[];
  songId: number;
  duration: number;
  bpm: number;
  isOwner: boolean;
  onTrackUpdated: (track: Track) => void;
  onTrackDeleted: (trackId: number) => void;
}

const TRACK_HEIGHT = 88;

export function DAW({
  tracks,
  songId,
  duration,
  bpm,
  isOwner,
  onTrackUpdated,
  onTrackDeleted,
}: DAWProps) {
  const [trackStates, setTrackStates] = useState<Map<number, TrackState>>(
    new Map()
  );
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTrackId, setDragOverTrackId] = useState<number | null>(null);
  const [uploadingTrackId, setUploadingTrackId] = useState<number | null>(null);
  const [trackOrder, setTrackOrder] = useState<number[]>([]);
  const [dragSourceId, setDragSourceId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const waveformRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wavesurferRefs = useRef<Map<number, WaveSurfer>>(new Map());
  const timelineRef = useRef<HTMLCanvasElement>(null);
  const waveformAreaRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const wasPlayingRef = useRef(false);
  const hasCountedPlayRef = useRef(false);

  const [recordingTrackId, setRecordingTrackId] = useState<number | null>(null);
  const [fxOpenTrackId, setFxOpenTrackId] = useState<number | null>(null);
  const [trackEffects, setTrackEffects] = useState<Map<number, EffectValues>>(new Map());
  const { uploadTrack, deleteTrack } = useApi();
  const { uploading, uploadFile } = useIpfs();
  const { recording, recordingTime, startRecording, stopRecording, cancelRecording } = useRecorder();
  const { metronomeActive, toggleMetronome, stopMetronome } = useMetronome();
  const { toast } = useToast();

  // Get the actual longest audio duration from WaveSurfer instances
  const getAudioDuration = useCallback(() => {
    let maxDur = 0;
    trackStates.forEach((ts) => {
      if (ts.wavesurfer) {
        const d = ts.wavesurfer.getDuration();
        if (d > maxDur) maxDur = d;
      }
    });
    return maxDur || duration;
  }, [trackStates, duration]);

  const timelineDuration = getAudioDuration();

  // --- Timeline ruler ---
  useEffect(() => {
    const canvas = timelineRef.current;
    const dur = timelineDuration;
    if (!canvas || dur <= 0) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const tickInterval = dur <= 30 ? 1 : dur <= 120 ? 5 : 10;
      const majorInterval = tickInterval * (dur <= 30 ? 5 : 2);

      for (let t = 0; t <= dur; t += tickInterval) {
        const x = (t / dur) * rect.width;
        const isMajor = t % majorInterval === 0;
        ctx.beginPath();
        ctx.moveTo(x, isMajor ? 0 : rect.height * 0.55);
        ctx.lineTo(x, rect.height);
        ctx.strokeStyle = isMajor ? "#52525b" : "#3f3f46";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.stroke();

        if (isMajor) {
          const m = Math.floor(t / 60);
          const s = t % 60;
          ctx.fillStyle = "#71717a";
          ctx.font = "10px ui-monospace, monospace";
          ctx.fillText(`${m}:${s.toString().padStart(2, "0")}`, x + 3, 11);
        }
      }
    };

    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [timelineDuration]);

  // --- Create WaveSurfer when a container mounts (ref callback) ---
  const initWaveSurfer = useCallback(
    (trackId: number, container: HTMLDivElement | null, ipfsUrl: string, instrument: string) => {
      // Ignore null calls (React cleanup on re-render) — don't destroy anything
      if (!container) return;

      // Already initialized for this container + URL combo
      const existing = wavesurferRefs.current.get(trackId);
      if (existing && waveformRefs.current.get(trackId) === container) return;

      // Destroy old instance if container or URL changed
      if (existing) existing.destroy();

      waveformRefs.current.set(trackId, container);
      container.innerHTML = "";

      const ws = WaveSurfer.create({
        container,
        waveColor: getTrackColor(instrument, 0.5),
        progressColor: getTrackColor(instrument, 1),
        height: TRACK_HEIGHT,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
        normalize: true,
        interact: false,
        url: ipfsUrl,
      });

      wavesurferRefs.current.set(trackId, ws);

      ws.on("ready", () => {
        setIsReady(true);
        setTrackStates((prev) => {
          const next = new Map(prev);
          const ts = next.get(trackId);
          if (ts) next.set(trackId, { ...ts, wavesurfer: ws });
          return next;
        });
      });
    },
    []
  );

  // --- Track ordering ---
  const trackIds = tracks.map((t) => t.id).join(",");
  useEffect(() => {
    setTrackOrder((prev) => {
      const ids = trackIds.split(",").filter(Boolean).map(Number);
      const currentIds = new Set(ids);
      const kept = prev.filter((id) => currentIds.has(id));
      const newIds = ids.filter((id) => !kept.includes(id));
      const next = [...kept, ...newIds];
      // Only update if actually changed
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [trackIds]);

  const orderedTracks = trackOrder.length > 0
    ? trackOrder.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[]
    : tracks;

  const handleDragEnd = useCallback(() => {
    if (dragSourceId !== null && dragOverId !== null && dragSourceId !== dragOverId) {
      setTrackOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(dragSourceId);
        const toIdx = next.indexOf(dragOverId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, dragSourceId);
        return next;
      });
    }
    setDragSourceId(null);
    setDragOverId(null);
  }, [dragSourceId, dragOverId]);

  // --- Sync track data into trackStates (without touching WaveSurfer) ---
  // Use a stable key so this only re-runs when tracks actually change
  const tracksKey = tracks.map((t) => `${t.id}:${t.ipfsUrl ?? ""}:${t.status}`).join("|");
  useEffect(() => {
    setTrackStates((prev) => {
      const next = new Map<number, TrackState>();
      tracks.forEach((track) => {
        const existing = prev.get(track.id);
        next.set(track.id, {
          track,
          wavesurfer: existing?.wavesurfer ?? wavesurferRefs.current.get(track.id) ?? null,
          volume: existing?.volume ?? 0.8,
          pan: existing?.pan ?? 0,
          muted: existing?.muted ?? false,
          solo: existing?.solo ?? false,
        });
      });
      return next;
    });
    if (tracks.filter((t) => t.ipfsUrl).length === 0) setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracksKey]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      wavesurferRefs.current.forEach((ws) => ws.destroy());
      wavesurferRefs.current.clear();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // --- Playback time via rAF (smooth) ---
  const tickPlayback = useCallback(() => {
    const first = Array.from(trackStates.values()).find((ts) => ts.wavesurfer);
    if (first?.wavesurfer) {
      const t = first.wavesurfer.getCurrentTime();
      setCurrentTime(t);
      // Stop when track ends
      if (first.wavesurfer.getDuration() > 0 && t >= first.wavesurfer.getDuration()) {
        setPlaying(false);
        return;
      }
    }
    animFrameRef.current = requestAnimationFrame(tickPlayback);
  }, [trackStates]);

  // Start / stop rAF loop when playing changes
  useEffect(() => {
    if (playing) {
      animFrameRef.current = requestAnimationFrame(tickPlayback);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, tickPlayback]);

  // --- Transport ---
  const playAll = useCallback(() => {
    const hasSolo = Array.from(trackStates.values()).some((ts) => ts.solo);
    trackStates.forEach((ts) => {
      if (!ts.wavesurfer) return;
      const shouldPlay = hasSolo ? ts.solo : !ts.muted;
      ts.wavesurfer.setVolume(shouldPlay ? ts.volume : 0);
      ts.wavesurfer.play();
    });
    setPlaying(true);
    // Count play once per session
    if (!hasCountedPlayRef.current) {
      hasCountedPlayRef.current = true;
      fetch(`/api/songs/${songId}/play`, { method: "POST" }).catch(() => {});
    }
  }, [trackStates]);

  const pauseAll = useCallback(() => {
    trackStates.forEach((ts) => ts.wavesurfer?.pause());
    setPlaying(false);
  }, [trackStates]);

  const stopAll = useCallback(() => {
    trackStates.forEach((ts) => ts.wavesurfer?.stop());
    setPlaying(false);
    setCurrentTime(0);
    stopMetronome();
  }, [trackStates, stopMetronome]);

  const seekAll = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const targetTime = clamped * timelineDuration;
      trackStates.forEach((ts) => {
        if (!ts.wavesurfer) return;
        const audioDur = ts.wavesurfer.getDuration();
        if (audioDur > 0) {
          ts.wavesurfer.seekTo(Math.min(1, targetTime / audioDur));
        }
      });
      setCurrentTime(targetTime);
    },
    [trackStates, timelineDuration]
  );

  // --- Keyboard shortcuts ---
  const uploadedCount = tracks.filter((t) => t.ipfsUrl).length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (uploadedCount === 0) return;
          if (playing) {
            trackStates.forEach((ts) => ts.wavesurfer?.pause());
            setPlaying(false);
          } else {
            const hasSolo = Array.from(trackStates.values()).some((ts) => ts.solo);
            trackStates.forEach((ts) => {
              if (!ts.wavesurfer) return;
              const shouldPlay = hasSolo ? ts.solo : !ts.muted;
              ts.wavesurfer.setVolume(shouldPlay ? ts.volume : 0);
              ts.wavesurfer.play();
            });
            setPlaying(true);
          }
          break;
        case "Home":
          e.preventDefault();
          trackStates.forEach((ts) => ts.wavesurfer?.stop());
          setPlaying(false);
          setCurrentTime(0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekAll(Math.max(0, (currentTime - 5) / timelineDuration));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekAll(Math.min(1, (currentTime + 5) / timelineDuration));
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playing, trackStates, currentTime, timelineDuration, seekAll, uploadedCount]);

  // --- Drag-to-seek (playhead + waveform area) ---
  const getProgressFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const area = waveformAreaRef.current;
      if (!area) return 0;
      const rect = area.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      wasPlayingRef.current = playing;
      if (playing) {
        trackStates.forEach((ts) => ts.wavesurfer?.pause());
      }
      const progress = getProgressFromEvent(e);
      seekAll(progress);

      const onMove = (ev: MouseEvent) => {
        const p = getProgressFromEvent(ev);
        seekAll(p);
      };
      const onUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (wasPlayingRef.current) {
          // Resume after drag
          trackStates.forEach((ts) => {
            if (!ts.wavesurfer) return;
            ts.wavesurfer.play();
          });
          setPlaying(true);
        }
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [playing, trackStates, seekAll, getProgressFromEvent]
  );

  // --- Track state updates ---
  const updateTrackState = useCallback(
    (trackId: number, update: Partial<TrackState>) => {
      setTrackStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(trackId);
        if (existing) {
          const updated = { ...existing, ...update };
          if (updated.wavesurfer) {
            const hasSolo =
              Array.from(next.values()).some(
                (ts) => ts.track.id !== trackId && ts.solo
              ) || updated.solo;
            if (hasSolo) {
              updated.wavesurfer.setVolume(updated.solo ? updated.volume : 0);
            } else {
              updated.wavesurfer.setVolume(updated.muted ? 0 : updated.volume);
            }
          }
          next.set(trackId, updated);
        }
        return next;
      });
    },
    []
  );

  const handleRecord = useCallback(
    async (trackId: number) => {
      if (recording && recordingTrackId === trackId) {
        // Stop and upload
        try {
          const { blob } = await stopRecording();
          const file = new File([blob], "recording.webm", { type: "audio/webm" });
          setUploadingTrackId(trackId);
          setRecordingTrackId(null);
          const { url } = await uploadFile(file);
          const updated = await uploadTrack(trackId, url);
          onTrackUpdated(updated);
          toast("Recording uploaded", "success");
        } catch {
          toast("Recording failed", "error");
        } finally {
          setUploadingTrackId(null);
        }
      } else {
        // Start recording
        if (recording) cancelRecording();
        try {
          await startRecording();
          setRecordingTrackId(trackId);
          toast("Recording started — click again to stop", "info");
        } catch {
          toast("Microphone access denied", "error");
        }
      }
    },
    [recording, recordingTrackId, stopRecording, startRecording, cancelRecording, uploadFile, uploadTrack, onTrackUpdated, toast]
  );

  const handleUpload = useCallback(
    async (trackId: number, file: File) => {
      setUploadingTrackId(trackId);
      try {
        const { url } = await uploadFile(file);
        const updated = await uploadTrack(trackId, url);
        onTrackUpdated(updated);
        toast("Track uploaded successfully", "success");
      } catch {
        toast("Failed to upload track", "error");
      } finally {
        setUploadingTrackId(null);
      }
    },
    [uploadFile, uploadTrack, onTrackUpdated, toast]
  );

  const handleDelete = useCallback(
    async (trackId: number) => {
      if (!confirm("Delete this track?")) return;
      try {
        const ws = wavesurferRefs.current.get(trackId);
        ws?.destroy();
        wavesurferRefs.current.delete(trackId);
        await deleteTrack(trackId);
        onTrackDeleted(trackId);
        toast("Track deleted", "info");
      } catch {
        toast("Failed to delete track", "error");
      }
    },
    [deleteTrack, onTrackDeleted, toast]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  const playheadPercent = timelineDuration > 0 ? (currentTime / timelineDuration) * 100 : 0;

  return (
    <div className="bg-[#0c0c0e] rounded-xl overflow-hidden border border-zinc-800/50 shadow-2xl select-none">
      {/* ═══ Transport Bar ═══ */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[#111113] border-b border-zinc-800/50">
        {/* Transport buttons */}
        <div className="flex items-center gap-1">
          <button onClick={stopAll} className="w-7 h-7 flex items-center justify-center rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-500 hover:text-white transition" title="Stop [Home]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1"/></svg>
          </button>
          <button
            onClick={playing ? pauseAll : playAll}
            disabled={uploadedCount === 0}
            className={`w-9 h-9 flex items-center justify-center rounded-md transition-all ${
              playing
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/25"
                : uploadedCount === 0
                ? "bg-zinc-800/80 text-zinc-600 cursor-not-allowed"
                : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/25"
            }`}
            title={`${playing ? "Pause" : "Play"} [Space]`}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="0" width="3" height="12" rx="1"/><rect x="8" y="0" width="3" height="12" rx="1"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 0.5v11l9-5.5z"/></svg>
            )}
          </button>
          <button onClick={() => toggleMetronome(bpm)}
            className={`w-7 h-7 flex items-center justify-center rounded transition ${metronomeActive ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40" : "bg-zinc-800/80 text-zinc-600 hover:text-zinc-300"}`}
            title={`Click ${bpm} BPM`}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L3 14h10L8 1zm0 4l2.5 7h-5L8 5z"/></svg>
          </button>
        </div>

        <div className="w-px h-7 bg-zinc-800/60" />

        {/* Time + BPM display */}
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm tabular-nums bg-black/40 px-2.5 py-1 rounded border border-zinc-800/50 min-w-[130px] text-center">
            <span className="text-emerald-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-zinc-700 mx-0.5">/</span>
            <span className="text-zinc-500">{formatTime(timelineDuration)}</span>
          </div>
          <div className="font-mono text-xs bg-black/40 px-2 py-1 rounded border border-zinc-800/50 text-orange-400/80 hidden sm:block">
            {bpm} <span className="text-zinc-600 text-[9px]">BPM</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 ml-auto text-[11px] text-zinc-500">
          <span className="hidden sm:flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${uploadedCount > 0 ? "bg-emerald-500" : "bg-zinc-600"}`}/>
            {uploadedCount}/{tracks.length}
          </span>
          {uploading && (
            <span className="flex items-center gap-1 text-blue-400">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <span className="animate-pulse text-[10px]">IPFS</span>
            </span>
          )}
          {recording && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
              <span className="text-[10px] font-mono">REC</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══ Timeline + Tracks ═══ */}
      <div className="flex">
        {/* Track Controls Column */}
        <div className="hidden sm:block w-56 flex-shrink-0 bg-[#0e0e10]">
          <div className="h-7 border-b border-zinc-800/40 bg-[#111113] flex items-center justify-between px-3">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Mixer</span>
            <span className="text-[9px] text-zinc-700">{orderedTracks.length} trk</span>
          </div>
          {orderedTracks.map((track, idx) => {
            const ts = trackStates.get(track.id);
            return (
              <TrackControls
                key={track.id}
                track={track}
                index={idx}
                height={TRACK_HEIGHT}
                volume={ts?.volume ?? 0.8}
                pan={ts?.pan ?? 0}
                muted={ts?.muted ?? false}
                solo={ts?.solo ?? false}
                onVolumeChange={(v) => updateTrackState(track.id, { volume: v })}
                onPanChange={(p) => updateTrackState(track.id, { pan: p })}
                onMute={() => updateTrackState(track.id, { muted: !(ts?.muted ?? false) })}
                onSolo={() => updateTrackState(track.id, { solo: !(ts?.solo ?? false) })}
                onUpload={(file) => handleUpload(track.id, file)}
                onRecord={() => handleRecord(track.id)}
                recording={recording && recordingTrackId === track.id}
                onFx={() => setFxOpenTrackId(fxOpenTrackId === track.id ? null : track.id)}
                fxActive={(() => { const fx = trackEffects.get(track.id); return !!fx && JSON.stringify(fx) !== JSON.stringify(DEFAULT_EFFECTS); })()}
                onDelete={() => handleDelete(track.id)}
                onDragStart={() => setDragSourceId(track.id)}
                onDragOver={() => setDragOverId(track.id)}
                onDragEnd={handleDragEnd}
                isDragOver={dragOverId === track.id && dragSourceId !== track.id}
                isOwner={isOwner}
              />
            );
          })}
          {tracks.length === 0 && (
            <div className="flex items-center justify-center text-zinc-600 text-xs" style={{ height: TRACK_HEIGHT * 2 }}>
              {isOwner ? "Add a track to begin" : "No tracks yet"}
            </div>
          )}
        </div>

        {/* Waveform Area */}
        <div className="flex-1 min-w-0 relative bg-[#0a0a0c]" ref={waveformAreaRef}>
          {/* Timeline Ruler */}
          <div className="h-7 border-b border-zinc-800/40 bg-[#0e0e10] relative cursor-pointer" onMouseDown={handlePointerDown}>
            <canvas ref={timelineRef} className="w-full h-full" style={{ display: "block" }} />
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: `${playheadPercent}%`, transition: isDragging ? "none" : "left 50ms linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #34d399" }}/>
            <div className="absolute top-[7px] bottom-0 left-1/2 -translate-x-1/2 w-px bg-emerald-400/80"/>
            {/* Glow */}
            <div className="absolute top-[7px] bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-emerald-400/15 blur-[1px]"/>
          </div>

          {/* Drag handle */}
          <div className="absolute top-0 bottom-0 z-40 cursor-col-resize"
            style={{ left: `calc(${playheadPercent}% - 8px)`, width: 16, transition: isDragging ? "none" : "left 50ms linear" }}
            onMouseDown={handlePointerDown}/>

          {/* Click-to-seek */}
          <div className="absolute top-7 left-0 right-0 bottom-0 z-10 cursor-crosshair" onMouseDown={handlePointerDown}/>

          {/* Waveform rows */}
          {orderedTracks.map((track, idx) => {
            const isUploadingThis = uploadingTrackId === track.id;
            const isRecordingThis = recording && recordingTrackId === track.id;
            const trackColor = getTrackColor(track.instrument, 1);
            return (
              <div
                key={track.id}
                className="border-b border-zinc-800/20 relative group"
                style={{ height: TRACK_HEIGHT, background: idx % 2 === 0 ? "#0a0a0c" : "#0c0c0e" }}
              >
                {/* Mobile instrument label */}
                <div className="absolute top-1 left-1 z-[5] sm:hidden">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm" style={{ color: trackColor }}>
                    {track.instrument}
                  </span>
                </div>

                {/* Beat grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent ${100 / Math.max(1, timelineDuration / (60 / bpm))}%)`,
                }} />

                {track.ipfsUrl ? (
                  <div
                    ref={(el) => initWaveSurfer(track.id, el, track.ipfsUrl!, track.instrument)}
                    className="w-full h-full"
                  />
                ) : isRecordingThis ? (
                  <div className="absolute inset-2 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-400 font-medium font-mono">
                        REC {Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ) : isUploadingThis ? (
                  <div className="absolute inset-2 flex items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      <span className="text-xs text-blue-400 font-medium">Uploading to IPFS...</span>
                    </div>
                    {/* Animated progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-500 animate-[indeterminate_1.5s_ease-in-out_infinite]"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`absolute inset-2 flex items-center justify-center border border-dashed rounded-lg transition-colors ${
                      dragOverTrackId === track.id
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-zinc-800/60 bg-zinc-900/20"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTrackId(track.id);
                    }}
                    onDragLeave={() => setDragOverTrackId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTrackId(null);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("audio/")) {
                        handleUpload(track.id, file);
                      }
                    }}
                  >
                    <span className="text-[11px] text-zinc-700">
                      {dragOverTrackId === track.id
                        ? "Drop audio file here"
                        : track.status === "editing"
                        ? "Recording..."
                        : "Drop audio file or click upload"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {tracks.length === 0 && (
            <div className="flex items-center justify-center" style={{ height: TRACK_HEIGHT * 2 }}>
              <div className="text-center text-zinc-700">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
                </svg>
                <p className="text-[11px]">Add tracks to start your session</p>
                <p className="text-[9px] text-zinc-800 mt-1">Space to play &middot; Arrows to seek</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Effects Panel */}
      {fxOpenTrackId !== null && (() => {
        const track = tracks.find((t) => t.id === fxOpenTrackId);
        if (!track) return null;
        return (
          <div className="border-t border-zinc-800/40 p-3 bg-[#0e0e10]">
            <TrackEffects
              instrument={track.instrument}
              values={trackEffects.get(fxOpenTrackId) ?? DEFAULT_EFFECTS}
              onChange={(vals) => {
                setTrackEffects((prev) => {
                  const next = new Map(prev);
                  next.set(fxOpenTrackId, vals);
                  return next;
                });
              }}
              onClose={() => setFxOpenTrackId(null)}
            />
          </div>
        );
      })()}

      {/* Indeterminate animation keyframe */}
      <style jsx>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

function getTrackColor(instrument: string, alpha: number): string {
  const colors: Record<string, [number, number, number]> = {
    Bass:       [59, 130, 246],
    AGuitar:    [239, 68, 68],
    EGuitar:    [249, 115, 22],
    Drums:      [234, 179, 8],
    Harp:       [139, 92, 246],
    Flute:      [236, 72, 153],
    Percussion: [245, 158, 11],
    Piano:      [124, 58, 237],
    Saxophone:  [234, 88, 12],
    Triangle:   [6, 182, 212],
    Violine:    [217, 70, 239],
    Vocals:     [16, 185, 129],
  };
  const c = colors[instrument] ?? [107, 114, 128];
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
