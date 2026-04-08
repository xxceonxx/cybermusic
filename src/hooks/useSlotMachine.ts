"use client";

import { useState, useCallback } from "react";
import { useApi } from "./useApi";
import type { Track, Song } from "@/types";

interface SlotResult {
  song: Song;
  track: Track;
  instrument: string;
}

export function useSlotMachine() {
  const [spinning, setSpinning] = useState(false);
  const { fetchOpenTracks, claimTrack, fetchSong } = useApi();

  const spin = useCallback(
    async (instruments: string[]): Promise<SlotResult | null> => {
      setSpinning(true);
      try {
        const openTracks = await fetchOpenTracks(instruments);

        if (openTracks.length === 0) return null;

        // Pick a random track
        const track = openTracks[Math.floor(Math.random() * openTracks.length)];
        const claimed = await claimTrack(track.id);
        const song = await fetchSong(track.songId);

        return {
          song,
          track: claimed,
          instrument: track.instrument,
        };
      } finally {
        setSpinning(false);
      }
    },
    [fetchOpenTracks, claimTrack, fetchSong]
  );

  return { spinning, spin };
}
