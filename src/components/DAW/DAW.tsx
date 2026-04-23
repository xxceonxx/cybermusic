"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { useApi } from "@/hooks/useApi";
import { useIpfs } from "@/hooks/useIpfs";
import { useRecorder } from "@/hooks/useRecorder";
import { useMetronome } from "@/hooks/useMetronome";
import { useToast } from "@/components/ui/Toast";
import { TrackEffects, DEFAULT_EFFECTS, type EffectValues } from "./TrackEffects";
import { TransportBar } from "./TransportBar";
import { TimelineRuler } from "./TimelineRuler";
import { TrackRow } from "./TrackRow";
import { getTrackColor, TRACK_HEIGHT } from "./colors";
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

export function DAW({
  tracks,
  songId,
  duration,
  bpm,
  isOwner,
  onTrackUpdated,
  onTrackDeleted,
}: DAWProps) {
  const [trackStates, setTrackStates] = useState<Map<number, TrackState>>(new Map());
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setIsReady] = useState(false);
  const [dragOverTrackId, setDragOverTrackId] = useState<number | null>(null);
  const [uploadingTrackId, setUploadingTrackId] = useState<number | null>(null);
  const [trackOrder, setTrackOrder] = useState<number[]>([]);
  const [dragSourceId, setDragSourceId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [recordingTrackId, setRecordingTrackId] = useState<number | null>(null);
  const [fxOpenTrackId, setFxOpenTrackId] = useState<number | null>(null);
  const [trackEffects, setTrackEffects] = useState<Map<number, EffectValues>>(new Map());
  const [looping, setLooping] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);

  const waveformRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wavesurferRefs = useRef<Map<number, WaveSurfer>>(new Map());
  const waveformAreaRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const playheadHitRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const wasPlayingRef = useRef(false);
  const hasCountedPlayRef = useRef(false);
  const lastStateUpdateRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  const { uploadTrack, deleteTrack } = useApi();
  const { uploading, uploadFile } = useIpfs();
  const { recording, recordingTime, startRecording, stopRecording, cancelRecording } = useRecorder();
  const { stopMetronome } = useMetronome();
  const { toast } = useToast();

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

  const initWaveSurfer = useCallback(
    (trackId: number, container: HTMLDivElement | null, ipfsUrl: string, instrument: string) => {
      if (!container) return;
      const existing = wavesurferRefs.current.get(trackId);
      if (existing && waveformRefs.current.get(trackId) === container) return;
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

  const trackIds = tracks.map((t) => t.id).join(",");
  useEffect(() => {
    setTrackOrder((prev) => {
      const ids = trackIds.split(",").filter(Boolean).map(Number);
      const currentIds = new Set(ids);
      const kept = prev.filter((id) => currentIds.has(id));
      const newIds = ids.filter((id) => !kept.includes(id));
      const next = [...kept, ...newIds];
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [trackIds]);

  const orderedTracks =
    trackOrder.length > 0
      ? (trackOrder.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[])
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

  useEffect(() => {
    const surfers = wavesurferRefs.current;
    return () => {
      surfers.forEach((ws) => ws.destroy());
      surfers.clear();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const updatePlayheadDOM = useCallback((pct: number) => {
    const left = `${pct}%`;
    if (playheadRef.current) playheadRef.current.style.left = left;
    if (playheadHitRef.current) playheadHitRef.current.style.left = `calc(${pct}% - 8px)`;
  }, []);

  const tickPlayback = useCallback(() => {
    const first = Array.from(trackStates.values()).find((ts) => ts.wavesurfer);
    if (first?.wavesurfer) {
      const t = first.wavesurfer.getCurrentTime();
      currentTimeRef.current = t;

      if (timelineDuration > 0) updatePlayheadDOM((t / timelineDuration) * 100);

      const now = performance.now();
      if (now - lastStateUpdateRef.current > 100) {
        lastStateUpdateRef.current = now;
        setCurrentTime(t);
      }

      if (timelineDuration > 0 && t >= timelineDuration) {
        if (looping) {
          trackStates.forEach((ts) => {
            if (!ts.wavesurfer) return;
            ts.wavesurfer.seekTo(0);
            ts.wavesurfer.play();
          });
          currentTimeRef.current = 0;
          setCurrentTime(0);
          updatePlayheadDOM(0);
        } else {
          setPlaying(false);
          setCurrentTime(t);
          return;
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(tickPlayback);
  }, [trackStates, looping, timelineDuration, updatePlayheadDOM]);

  useEffect(() => {
    if (playing) {
      animFrameRef.current = requestAnimationFrame(tickPlayback);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, tickPlayback]);

  const playAll = useCallback(() => {
    const hasSolo = Array.from(trackStates.values()).some((ts) => ts.solo);
    trackStates.forEach((ts) => {
      if (!ts.wavesurfer) return;
      const shouldPlay = hasSolo ? ts.solo : !ts.muted;
      ts.wavesurfer.setVolume(shouldPlay ? ts.volume * masterVolume : 0);
      ts.wavesurfer.play();
    });
    setPlaying(true);
    if (!hasCountedPlayRef.current) {
      hasCountedPlayRef.current = true;
      fetch(`/api/songs/${songId}/play`, { method: "POST" }).catch(() => {});
    }
  }, [trackStates, masterVolume, songId]);

  const pauseAll = useCallback(() => {
    trackStates.forEach((ts) => ts.wavesurfer?.pause());
    setPlaying(false);
  }, [trackStates]);

  const stopAll = useCallback(() => {
    trackStates.forEach((ts) => ts.wavesurfer?.stop());
    setPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    updatePlayheadDOM(0);
    stopMetronome();
  }, [trackStates, stopMetronome, updatePlayheadDOM]);

  const seekAll = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const targetTime = clamped * timelineDuration;
      trackStates.forEach((ts) => {
        if (!ts.wavesurfer) return;
        const audioDur = ts.wavesurfer.getDuration();
        if (audioDur > 0) ts.wavesurfer.seekTo(Math.min(1, targetTime / audioDur));
      });
      currentTimeRef.current = targetTime;
      setCurrentTime(targetTime);
      updatePlayheadDOM(clamped * 100);
    },
    [trackStates, timelineDuration, updatePlayheadDOM]
  );

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
          if (playing) pauseAll();
          else playAll();
          break;
        case "Home":
          e.preventDefault();
          stopAll();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekAll(Math.max(0, (currentTime - 5) / timelineDuration));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekAll(Math.min(1, (currentTime + 5) / timelineDuration));
          break;
        case "KeyL":
          e.preventDefault();
          setLooping((l) => !l);
          break;
        case "KeyM":
          e.preventDefault();
          setMasterVolume((v) => (v > 0 ? 0 : 0.8));
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playing, currentTime, timelineDuration, seekAll, uploadedCount, playAll, pauseAll, stopAll]);

  const getProgressFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const area = waveformAreaRef.current;
    if (!area) return 0;
    const rect = area.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      wasPlayingRef.current = playing;
      if (playing) trackStates.forEach((ts) => ts.wavesurfer?.pause());
      seekAll(getProgressFromEvent(e));

      const onMove = (ev: MouseEvent) => seekAll(getProgressFromEvent(ev));
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (wasPlayingRef.current) {
          trackStates.forEach((ts) => ts.wavesurfer?.play());
          setPlaying(true);
        }
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [playing, trackStates, seekAll, getProgressFromEvent]
  );

  const updateTrackState = useCallback(
    (trackId: number, update: Partial<TrackState>) => {
      setTrackStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(trackId);
        if (existing) {
          const updated = { ...existing, ...update };
          if (updated.wavesurfer) {
            const hasSolo =
              Array.from(next.values()).some((ts) => ts.track.id !== trackId && ts.solo) ||
              updated.solo;
            if (hasSolo) {
              updated.wavesurfer.setVolume(updated.solo ? updated.volume * masterVolume : 0);
            } else {
              updated.wavesurfer.setVolume(updated.muted ? 0 : updated.volume * masterVolume);
            }
          }
          next.set(trackId, updated);
        }
        return next;
      });
    },
    [masterVolume]
  );

  useEffect(() => {
    const hasSolo = Array.from(trackStates.values()).some((ts) => ts.solo);
    trackStates.forEach((ts) => {
      if (!ts.wavesurfer) return;
      const shouldPlay = hasSolo ? ts.solo : !ts.muted;
      ts.wavesurfer.setVolume(shouldPlay ? ts.volume * masterVolume : 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterVolume]);

  const handleRecord = useCallback(
    async (trackId: number) => {
      if (recording && recordingTrackId === trackId) {
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

  const playheadPercent = timelineDuration > 0 ? (currentTime / timelineDuration) * 100 : 0;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const step = (delta > 0 ? 1 : -1) / timelineDuration;
      seekAll(Math.max(0, Math.min(1, currentTime / timelineDuration + step)));
    },
    [currentTime, timelineDuration, seekAll]
  );

  const anySolo = Array.from(trackStates.values()).some((ts) => ts.solo);

  return (
    <div className="bg-[#0c0c0e] rounded-xl overflow-hidden border border-zinc-800/50 shadow-2xl select-none">
      <TransportBar
        playing={playing}
        canPlay={uploadedCount > 0}
        currentTime={currentTime}
        timelineDuration={timelineDuration}
        bpm={bpm}
        looping={looping}
        masterVolume={masterVolume}
        uploading={uploading}
        recording={recording}
        onPlay={playAll}
        onPause={pauseAll}
        onStop={stopAll}
        onToggleLoop={() => setLooping((l) => !l)}
        onMasterVolumeChange={setMasterVolume}
      />

      <div className="relative" ref={waveformAreaRef} onWheel={handleWheel}>
        <TimelineRuler duration={timelineDuration} onSeekDown={handlePointerDown} />

        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 z-30 pointer-events-none will-change-[left]"
          style={{ left: `${playheadPercent}%` }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid #34d399",
            }}
          />
          <div className="absolute top-[8px] bottom-0 left-1/2 -translate-x-1/2 w-px bg-emerald-400/80" />
          <div className="absolute top-[8px] bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-emerald-400/15 blur-[1px]" />
        </div>

        <div
          ref={playheadHitRef}
          className="absolute top-0 bottom-0 z-40 cursor-col-resize"
          style={{ left: `calc(${playheadPercent}% - 8px)`, width: 16 }}
          onMouseDown={handlePointerDown}
        />

        <div
          className="absolute top-8 left-0 right-0 bottom-0 z-10 cursor-crosshair"
          onMouseDown={handlePointerDown}
        />

        {orderedTracks.map((track, idx) => {
          const ts = trackStates.get(track.id);
          const isDimmed = (ts?.muted ?? false) || (anySolo && !ts?.solo);
          return (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              volume={ts?.volume ?? 0.8}
              muted={ts?.muted ?? false}
              solo={ts?.solo ?? false}
              isOwner={isOwner}
              isDimmed={isDimmed}
              isDragOver={dragOverTrackId === track.id}
              isUploading={uploadingTrackId === track.id}
              isRecording={recording && recordingTrackId === track.id}
              recordingTime={recordingTime}
              bpm={bpm}
              timelineDuration={timelineDuration}
              onWaveformMount={(el) =>
                track.ipfsUrl && initWaveSurfer(track.id, el, track.ipfsUrl, track.instrument)
              }
              onVolumeChange={(v) => updateTrackState(track.id, { volume: v })}
              onToggleMute={() => updateTrackState(track.id, { muted: !(ts?.muted ?? false) })}
              onToggleSolo={() => updateTrackState(track.id, { solo: !(ts?.solo ?? false) })}
              onUpload={(file) => handleUpload(track.id, file)}
              onRecord={() => handleRecord(track.id)}
              onDelete={() => handleDelete(track.id)}
              onDragStart={() => setDragSourceId(track.id)}
              onDragOver={() => setDragOverId(track.id)}
              onDragEnd={handleDragEnd}
              onDropFile={(file) => handleUpload(track.id, file)}
              onDragFileOver={() => setDragOverTrackId(track.id)}
              onDragFileLeave={() => setDragOverTrackId(null)}
            />
          );
        })}

        {tracks.length === 0 && (
          <div className="flex items-center justify-center" style={{ height: TRACK_HEIGHT * 2 }}>
            <div className="text-center text-zinc-600">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
              <p className="text-sm">{isOwner ? "Add a track to start your session" : "No tracks yet"}</p>
              <p className="text-xs text-zinc-700 mt-1">Space = play · Arrows = seek · L = loop</p>
            </div>
          </div>
        )}
      </div>

      {fxOpenTrackId !== null &&
        (() => {
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

      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }
      `}</style>
    </div>
  );
}
