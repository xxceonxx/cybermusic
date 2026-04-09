"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { TrackControls } from "./TrackControls";
import { useApi } from "@/hooks/useApi";
import { useIpfs } from "@/hooks/useIpfs";
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
  isOwner: boolean;
  onTrackUpdated: (track: Track) => void;
  onTrackDeleted: (trackId: number) => void;
}

export function DAW({
  tracks,
  songId,
  duration,
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
  const waveformRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const { uploadTrack, deleteTrack } = useApi();
  const { uploading, uploadFile } = useIpfs();

  // Initialize WaveSurfer instances for tracks with audio
  useEffect(() => {
    const newStates = new Map<number, TrackState>();
    let loadedCount = 0;
    const tracksWithAudio = tracks.filter((t) => t.ipfsUrl);

    tracks.forEach((track) => {
      const existing = trackStates.get(track.id);
      if (existing) {
        newStates.set(track.id, { ...existing, track });
        if (track.ipfsUrl) loadedCount++;
        return;
      }

      const state: TrackState = {
        track,
        wavesurfer: null,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
      };

      if (track.ipfsUrl) {
        const container = waveformRefs.current.get(track.id);
        if (container) {
          container.innerHTML = "";
          const ws = WaveSurfer.create({
            container,
            waveColor: getTrackColor(track.instrument),
            progressColor: getTrackColorBright(track.instrument),
            height: 60,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            cursorWidth: 1,
            cursorColor: "#ffffff",
            normalize: true,
            interact: false,
            url: track.ipfsUrl,
          });

          ws.on("ready", () => {
            loadedCount++;
            if (loadedCount >= tracksWithAudio.length) {
              setIsReady(true);
            }
          });

          state.wavesurfer = ws;
        }
      }

      newStates.set(track.id, state);
    });

    setTrackStates(newStates);

    if (tracksWithAudio.length === 0) setIsReady(true);

    return () => {
      // Clean up on unmount only
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackStates.forEach((ts) => ts.wavesurfer?.destroy());
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAll = useCallback(() => {
    const hasSolo = Array.from(trackStates.values()).some((ts) => ts.solo);

    trackStates.forEach((ts) => {
      if (!ts.wavesurfer) return;
      const shouldPlay = hasSolo ? ts.solo : !ts.muted;
      ts.wavesurfer.setVolume(shouldPlay ? ts.volume : 0);
      ts.wavesurfer.play();
    });

    setPlaying(true);
    timerRef.current = setInterval(() => {
      const first = Array.from(trackStates.values()).find(
        (ts) => ts.wavesurfer
      );
      if (first?.wavesurfer) {
        setCurrentTime(first.wavesurfer.getCurrentTime());
      }
    }, 100);
  }, [trackStates]);

  const pauseAll = useCallback(() => {
    trackStates.forEach((ts) => ts.wavesurfer?.pause());
    setPlaying(false);
    clearInterval(timerRef.current);
  }, [trackStates]);

  const stopAll = useCallback(() => {
    trackStates.forEach((ts) => {
      ts.wavesurfer?.stop();
    });
    setPlaying(false);
    setCurrentTime(0);
    clearInterval(timerRef.current);
  }, [trackStates]);

  const seekAll = useCallback(
    (progress: number) => {
      trackStates.forEach((ts) => {
        ts.wavesurfer?.seekTo(progress);
      });
      setCurrentTime(progress * duration);
    },
    [trackStates, duration]
  );

  const updateTrackState = useCallback(
    (trackId: number, update: Partial<TrackState>) => {
      setTrackStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(trackId);
        if (existing) {
          const updated = { ...existing, ...update };
          // Apply volume/mute to wavesurfer
          if (updated.wavesurfer) {
            const hasSolo = Array.from(next.values()).some(
              (ts) => ts.track.id !== trackId && ts.solo
            ) || updated.solo;
            if (hasSolo) {
              updated.wavesurfer.setVolume(updated.solo ? updated.volume : 0);
            } else {
              updated.wavesurfer.setVolume(
                updated.muted ? 0 : updated.volume
              );
            }
          }
          next.set(trackId, updated);
        }
        return next;
      });
    },
    []
  );

  const handleUpload = useCallback(
    async (trackId: number, file: File) => {
      const { url } = await uploadFile(file);
      const updated = await uploadTrack(trackId, url);
      onTrackUpdated(updated);
    },
    [uploadFile, uploadTrack, onTrackUpdated]
  );

  const handleDelete = useCallback(
    async (trackId: number) => {
      if (!confirm("Delete this track?")) return;
      const ts = trackStates.get(trackId);
      ts?.wavesurfer?.destroy();
      await deleteTrack(trackId);
      onTrackDeleted(trackId);
    },
    [trackStates, deleteTrack, onTrackDeleted]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const uploadedCount = tracks.filter((t) => t.ipfsUrl).length;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Transport Bar */}
      <div className="flex items-center gap-4 p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={stopAll}
            className="w-8 h-8 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
          >
            ■
          </button>
          <button
            onClick={playing ? pauseAll : playAll}
            disabled={uploadedCount === 0}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition ${
              playing
                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                : uploadedCount === 0
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-green-500 text-black hover:bg-green-400"
            }`}
          >
            {playing ? "⏸" : "▶"}
          </button>
        </div>

        {/* Time Display */}
        <div className="font-mono text-lg tabular-nums">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-zinc-600"> / {formatTime(duration)}</span>
        </div>

        {/* Progress Bar */}
        <div
          className="flex-1 h-2 bg-zinc-800 rounded-full cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const progress = (e.clientX - rect.left) / rect.width;
            seekAll(Math.max(0, Math.min(1, progress)));
          }}
        >
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Track count */}
        <div className="text-xs text-zinc-500">
          {uploadedCount}/{tracks.length} tracks
        </div>
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          No tracks yet. {isOwner ? "Add an instrument to get started!" : ""}
        </div>
      ) : (
        <div>
          {tracks.map((track) => {
            const ts = trackStates.get(track.id);
            return (
              <div key={track.id} className="flex border-b border-zinc-800/50 last:border-b-0">
                {/* Controls */}
                <div className="w-80 flex-shrink-0">
                  <TrackControls
                    track={track}
                    volume={ts?.volume ?? 0.8}
                    pan={ts?.pan ?? 0}
                    muted={ts?.muted ?? false}
                    solo={ts?.solo ?? false}
                    onVolumeChange={(v) =>
                      updateTrackState(track.id, { volume: v })
                    }
                    onPanChange={(p) =>
                      updateTrackState(track.id, { pan: p })
                    }
                    onMute={() =>
                      updateTrackState(track.id, {
                        muted: !(ts?.muted ?? false),
                      })
                    }
                    onSolo={() =>
                      updateTrackState(track.id, {
                        solo: !(ts?.solo ?? false),
                      })
                    }
                    onUpload={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "audio/*";
                      input.onchange = () => {
                        if (input.files?.[0]) {
                          handleUpload(track.id, input.files[0]);
                        }
                      };
                      input.click();
                    }}
                    onDelete={() => handleDelete(track.id)}
                    isOwner={isOwner}
                  />
                </div>

                {/* Waveform */}
                <div className="flex-1 flex items-center bg-zinc-950 px-2 min-h-[80px]">
                  {track.ipfsUrl ? (
                    <div
                      ref={(el) => {
                        if (el) waveformRefs.current.set(track.id, el);
                      }}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full h-[60px] flex items-center justify-center border border-dashed border-zinc-700 rounded-lg">
                      <span className="text-xs text-zinc-600">
                        {track.status === "editing"
                          ? "Waiting for upload..."
                          : "No audio yet"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload indicator */}
      {uploading && (
        <div className="p-3 bg-blue-600/20 border-t border-blue-600/30 text-center text-sm text-blue-400">
          Uploading to IPFS...
        </div>
      )}
    </div>
  );
}

function getTrackColor(instrument: string): string {
  const colors: Record<string, string> = {
    Bass: "#4a9eff",
    AGuitar: "#ff6b6b",
    EGuitar: "#ff9f43",
    Drums: "#ffd93d",
    Harp: "#a29bfe",
    Flute: "#fd79a8",
    Percussion: "#fdcb6e",
    Piano: "#6c5ce7",
    Saxophone: "#e17055",
    Triangle: "#00cec9",
    Violine: "#e056fd",
    Vocals: "#55efc4",
  };
  return colors[instrument] ?? "#888888";
}

function getTrackColorBright(instrument: string): string {
  const colors: Record<string, string> = {
    Bass: "#74b9ff",
    AGuitar: "#ff8787",
    EGuitar: "#ffb56b",
    Drums: "#ffe66d",
    Harp: "#c4b5fd",
    Flute: "#fe9fc0",
    Percussion: "#fee5a0",
    Piano: "#9b8cff",
    Saxophone: "#f0826e",
    Triangle: "#4dd6d1",
    Violine: "#ee80ff",
    Vocals: "#7fffd4",
  };
  return colors[instrument] ?? "#aaaaaa";
}
