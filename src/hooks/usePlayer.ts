"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PlayerTrack {
  id: number;
  url: string;
  instrument: string;
}

interface TrackState {
  audio: HTMLAudioElement;
  volume: number;
}

export function usePlayer() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const tracksRef = useRef<Map<number, TrackState>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const loadTracks = useCallback((tracks: PlayerTrack[]) => {
    // Clean up existing
    tracksRef.current.forEach((t) => {
      t.audio.pause();
      t.audio.src = "";
    });
    tracksRef.current.clear();

    for (const track of tracks) {
      const audio = new Audio(track.url);
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.volume = 0.5;
      tracksRef.current.set(track.id, { audio, volume: 0.5 });

      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration > duration) {
          setDuration(audio.duration);
        }
      });
    }
  }, [duration]);

  const play = useCallback(() => {
    tracksRef.current.forEach((t) => t.audio.play());
    setPlaying(true);
    timerRef.current = setInterval(() => {
      const first = tracksRef.current.values().next().value;
      if (first) setCurrentTime(first.audio.currentTime);
    }, 200);
  }, []);

  const pause = useCallback(() => {
    tracksRef.current.forEach((t) => t.audio.pause());
    setPlaying(false);
    clearInterval(timerRef.current);
  }, []);

  const stop = useCallback(() => {
    tracksRef.current.forEach((t) => {
      t.audio.pause();
      t.audio.currentTime = 0;
    });
    setPlaying(false);
    setCurrentTime(0);
    clearInterval(timerRef.current);
  }, []);

  const setVolume = useCallback((trackId: number, volume: number) => {
    const track = tracksRef.current.get(trackId);
    if (track) {
      track.audio.volume = volume;
      track.volume = volume;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      tracksRef.current.forEach((t) => {
        t.audio.pause();
        t.audio.src = "";
      });
    };
  }, []);

  return {
    playing,
    currentTime,
    duration,
    loadTracks,
    play,
    pause,
    stop,
    setVolume,
  };
}
