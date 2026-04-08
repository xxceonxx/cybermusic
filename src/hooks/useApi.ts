"use client";

import { useState, useCallback } from "react";
import type { Song, Track } from "@/types";

type SongWithTracks = Song & { tracks: Track[] };

export function useApi() {
  const [loading, setLoading] = useState(false);

  const fetchSongs = useCallback(async (creatorId?: string): Promise<Song[]> => {
    const params = creatorId ? `?creator=${creatorId}` : "";
    const res = await fetch(`/api/songs${params}`);
    return res.json();
  }, []);

  const fetchSong = useCallback(async (id: number): Promise<SongWithTracks> => {
    const res = await fetch(`/api/songs/${id}`);
    if (!res.ok) throw new Error("Song not found");
    return res.json();
  }, []);

  const createSong = useCallback(
    async (data: { name: string; duration: number; bpm: number }): Promise<Song> => {
      setLoading(true);
      try {
        const res = await fetch("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create song");
        return res.json();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateSong = useCallback(
    async (id: number, data: Partial<Song>): Promise<Song> => {
      const res = await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update song");
      return res.json();
    },
    []
  );

  const deleteSong = useCallback(async (id: number): Promise<void> => {
    const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete song");
  }, []);

  const createTrack = useCallback(
    async (data: { songId: number; instrument: string }): Promise<Track> => {
      setLoading(true);
      try {
        const res = await fetch("/api/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create track");
        return res.json();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const claimTrack = useCallback(async (trackId: number): Promise<Track> => {
    const res = await fetch(`/api/tracks/${trackId}/claim`, { method: "PUT" });
    if (!res.ok) throw new Error("Failed to claim track");
    return res.json();
  }, []);

  const uploadTrack = useCallback(
    async (trackId: number, ipfsUrl: string): Promise<Track> => {
      const res = await fetch(`/api/tracks/${trackId}/upload`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipfsUrl }),
      });
      if (!res.ok) throw new Error("Failed to upload track");
      return res.json();
    },
    []
  );

  const deleteTrack = useCallback(async (trackId: number): Promise<void> => {
    const res = await fetch(`/api/tracks/${trackId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete track");
  }, []);

  const fetchOpenTracks = useCallback(
    async (instruments: string[]): Promise<Track[]> => {
      const res = await fetch(
        `/api/tracks?status=open&instrument=${instruments.join(",")}`
      );
      return res.json();
    },
    []
  );

  return {
    loading,
    fetchSongs,
    fetchSong,
    createSong,
    updateSong,
    deleteSong,
    createTrack,
    claimTrack,
    uploadTrack,
    deleteTrack,
    fetchOpenTracks,
  };
}
