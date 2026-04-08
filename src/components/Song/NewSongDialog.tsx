"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApi } from "@/hooks/useApi";
import type { Song } from "@/types";

interface NewSongDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (song: Song) => void;
}

export function NewSongDialog({ open, onClose, onCreated }: NewSongDialogProps) {
  const { createSong, loading } = useApi();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(120);
  const [bpm, setBpm] = useState(120);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const song = await createSong({ name, duration, bpm });
    setName("");
    setDuration(120);
    setBpm(120);
    onCreated(song);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create a new Song">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Song Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
            placeholder="My awesome song"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Duration: {duration}s
          </label>
          <input
            type="range"
            min={10}
            max={300}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            BPM: {bpm}
          </label>
          <input
            type="range"
            min={60}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition"
        >
          {loading ? "Creating..." : "Create Song"}
        </button>
      </form>
    </Dialog>
  );
}
