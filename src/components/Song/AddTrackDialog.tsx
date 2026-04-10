"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/Toast";
import { INSTRUMENTS } from "@/types";
import type { Track } from "@/types";

interface AddTrackDialogProps {
  open: boolean;
  onClose: () => void;
  songId: number;
  onAdded: (track: Track) => void;
}

export function AddTrackDialog({
  open,
  onClose,
  songId,
  onAdded,
}: AddTrackDialogProps) {
  const { createTrack, loading } = useApi();
  const { toast } = useToast();
  const [instrument, setInstrument] = useState(INSTRUMENTS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const track = await createTrack({ songId, instrument });
      onAdded(track);
      toast(`${instrument} track added`, "success");
    } catch {
      toast("Failed to add track", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Instrument Track">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Instrument
          </label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as typeof instrument)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
          >
            {INSTRUMENTS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition"
        >
          {loading ? "Adding..." : "Add Track"}
        </button>
      </form>
    </Dialog>
  );
}
