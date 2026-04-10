"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApi } from "@/hooks/useApi";
import { useIpfs } from "@/hooks/useIpfs";
import { useToast } from "@/components/ui/Toast";
import { GENRES } from "@/types";
import type { Song } from "@/types";

interface NewSongDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (song: Song) => void;
}

export function NewSongDialog({ open, onClose, onCreated }: NewSongDialogProps) {
  const { createSong, updateSong, loading } = useApi();
  const { uploadFile } = useIpfs();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(120);
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tapTimesRef = useRef<number[]>([]);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const song = await createSong({ name, duration, bpm, genre: genre || undefined });

      // Upload custom cover if selected
      if (coverFile) {
        const { url } = await uploadFile(coverFile);
        await updateSong(song.id, { image: url } as Partial<Song>);
        song.image = url;
      }

      setName("");
      setDuration(120);
      setBpm(120);
      setGenre("");
      setCoverFile(null);
      setCoverPreview(null);
      onCreated(song);
      toast("Song created", "success");
    } catch {
      toast("Failed to create song", "error");
    }
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-zinc-400">
              BPM: {bpm}
            </label>
            <button
              type="button"
              onClick={() => {
                const now = Date.now();
                const taps = tapTimesRef.current;
                // Reset if last tap was more than 2s ago
                if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
                  tapTimesRef.current = [];
                }
                taps.push(now);
                if (taps.length >= 2) {
                  // Average intervals
                  const intervals = [];
                  for (let i = 1; i < taps.length; i++) {
                    intervals.push(taps[i] - taps[i - 1]);
                  }
                  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                  const detected = Math.round(60000 / avg);
                  if (detected >= 60 && detected <= 300) setBpm(detected);
                }
                // Keep last 8 taps
                if (taps.length > 8) taps.shift();
              }}
              className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition font-medium"
            >
              Tap
            </button>
          </div>
          <input
            type="range"
            min={60}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Genre (optional)</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
          >
            <option value="">No genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Cover Art (optional)
          </label>
          <div className="flex items-center gap-3">
            {coverPreview ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative group/cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="16" height="16" rx="3" />
                  <path d="M10 6v8m-4-4h8" />
                </svg>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            <span className="text-xs text-zinc-600">
              {coverFile ? coverFile.name : "Random cover will be used"}
            </span>
          </div>
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
