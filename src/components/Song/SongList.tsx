"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/Toast";
import type { Song, Track } from "@/types";

type SongWithTracks = Song & { tracks?: Pick<Track, "id" | "instrument" | "status" | "ipfsUrl">[] };

interface SongListProps {
  songs: SongWithTracks[];
  onDelete?: (id: number) => void;
}

export function SongList({ songs, onDelete }: SongListProps) {
  const { deleteSong } = useApi();
  const { toast } = useToast();
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (e: React.MouseEvent, song: SongWithTracks) => {
    e.preventDefault();
    e.stopPropagation();

    // Find first uploaded track
    const previewUrl =
      song.ipfsUrl ??
      song.tracks?.find((t) => t.ipfsUrl)?.ipfsUrl;
    if (!previewUrl) return;

    if (playingSongId === song.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingSongId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(previewUrl);
    audio.volume = 0.7;
    audio.play();
    audio.onended = () => setPlayingSongId(null);
    audioRef.current = audio;
    setPlayingSongId(song.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this song?")) return;
    try {
      await deleteSong(id);
      onDelete?.(id);
      toast("Song deleted", "info");
    } catch {
      toast("Failed to delete song", "error");
    }
  };

  if (songs.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-12">No songs yet</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => {
        const openTracks = song.tracks?.filter((t) => t.status === "open") ?? [];
        const totalTracks = song.tracks?.length ?? 0;

        return (
          <Link
            key={song.id}
            href={`/song/${song.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition group block"
          >
            {song.image && (
              <div className="h-32 bg-zinc-800 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.image}
                  alt={song.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
                />
                {/* Play preview button */}
                {(song.ipfsUrl || song.tracks?.some((t) => t.ipfsUrl)) && (
                  <button
                    onClick={(e) => togglePreview(e, song)}
                    className="absolute bottom-2 left-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/70 hover:bg-emerald-600 text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  >
                    {playingSongId === song.id ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="2" y="1" width="3.5" height="12" rx="1" />
                        <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M3 1.5v11l9-5.5z" />
                      </svg>
                    )}
                  </button>
                )}
                {openTracks.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 rounded-full text-xs font-medium">
                    {openTracks.length} open slot{openTracks.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold group-hover:text-green-400 transition">
                {song.name}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {song.bpm} BPM &middot; {song.duration}s &middot; {totalTracks} track{totalTracks !== 1 ? "s" : ""}
                {(song.plays ?? 0) > 0 && (
                  <span className="ml-1.5 text-zinc-500">&middot; {song.plays} play{song.plays !== 1 ? "s" : ""}</span>
                )}
                {song.genre && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-zinc-800 rounded-full text-zinc-400">
                    {song.genre}
                  </span>
                )}
              </p>

              {/* Instrument chips */}
              {song.tracks && song.tracks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {song.tracks.map((t) => (
                    <span
                      key={t.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        t.status === "open"
                          ? "bg-green-900/50 text-green-300 border border-green-700/50"
                          : t.status === "uploaded"
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-yellow-900/50 text-yellow-300"
                      }`}
                    >
                      {t.instrument}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    song.status === "minted"
                      ? "bg-green-900 text-green-300"
                      : song.status === "open"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-blue-900 text-blue-300"
                  }`}
                >
                  {song.status}
                </span>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(song.id);
                    }}
                    className="text-xs text-zinc-500 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
