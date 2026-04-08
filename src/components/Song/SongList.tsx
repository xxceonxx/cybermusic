"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import type { Song } from "@/types";

interface SongListProps {
  songs: Song[];
  onDelete?: (id: number) => void;
}

export function SongList({ songs, onDelete }: SongListProps) {
  const { deleteSong } = useApi();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this song?")) return;
    await deleteSong(id);
    onDelete?.(id);
  };

  if (songs.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-12">No songs yet</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <div
          key={song.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition group"
        >
          {song.image && (
            <div className="h-32 bg-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={song.image}
                alt={song.name}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
              />
            </div>
          )}
          <div className="p-4">
            <Link
              href={`/song/${song.id}`}
              className="text-lg font-semibold hover:text-green-400 transition"
            >
              {song.name}
            </Link>
            <p className="text-sm text-zinc-400 mt-1">
              {song.bpm} BPM &middot; {song.duration}s
            </p>
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
                  onClick={() => handleDelete(song.id)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
