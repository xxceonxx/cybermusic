"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { SongList } from "@/components/Song/SongList";
import { ChooseInstrument } from "@/components/SlotMachine/ChooseInstrument";
import { SlotMachine } from "@/components/SlotMachine/SlotMachine";
import type { Song, Instrument } from "@/types";

export default function Discover() {
  const { isLoggedIn } = useAuth();
  const { fetchSongs } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);
  const [tab, setTab] = useState<"browse" | "slot">("browse");
  const [locked, setLocked] = useState<Instrument[]>([]);

  useEffect(() => {
    fetchSongs().then(setSongs);
  }, [fetchSongs]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center flex-1 text-zinc-500">
        Please login to discover songs
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Discover</h1>
      <p className="text-zinc-400 mb-8">
        Find songs that need your talent
      </p>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("browse")}
          className={`px-5 py-2.5 rounded-full font-medium transition ${
            tab === "browse"
              ? "bg-white text-black"
              : "border border-zinc-700 hover:bg-zinc-800"
          }`}
        >
          Browse Songs
        </button>
        <button
          onClick={() => setTab("slot")}
          className={`px-5 py-2.5 rounded-full font-medium transition ${
            tab === "slot"
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
              : "border border-zinc-700 hover:bg-zinc-800"
          }`}
        >
          Slot Machine
        </button>
      </div>

      {/* Browse Tab */}
      {tab === "browse" && (
        <div>
          {songs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-lg mb-2">
                No songs yet
              </p>
              <p className="text-zinc-600 text-sm">
                Be the first to create one!
              </p>
            </div>
          ) : (
            <SongList songs={songs} />
          )}
        </div>
      )}

      {/* Slot Machine Tab */}
      {tab === "slot" && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <ChooseInstrument onLock={setLocked} locked={locked} />
          <SlotMachine lockedInstruments={locked} />
        </div>
      )}
    </div>
  );
}
