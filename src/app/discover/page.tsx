"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { SongList } from "@/components/Song/SongList";
import { ChooseInstrument } from "@/components/SlotMachine/ChooseInstrument";
import { SlotMachine } from "@/components/SlotMachine/SlotMachine";
import { SongGridSkeleton } from "@/components/ui/Skeleton";
import { INSTRUMENTS, GENRES } from "@/types";
import type { Song, Instrument } from "@/types";

export default function Discover() {
  const { isLoggedIn } = useAuth();
  const { fetchSongs } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "slot">("browse");
  const [locked, setLocked] = useState<Instrument[]>([]);
  const [search, setSearch] = useState("");
  const [filterInstrument, setFilterInstrument] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "tracks" | "plays">("newest");

  useEffect(() => {
    fetchSongs().then(setSongs).finally(() => setLoading(false));
  }, [fetchSongs]);

  const filtered = useMemo(() => {
    let result = songs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (filterInstrument) {
      result = result.filter((s) =>
        s.tracks?.some((t) => t.instrument === filterInstrument)
      );
    }
    if (filterStatus) {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (filterGenre) {
      result = result.filter((s) => s.genre === filterGenre);
    }
    if (sortBy === "tracks") {
      result = [...result].sort(
        (a, b) => (b.tracks?.length ?? 0) - (a.tracks?.length ?? 0)
      );
    } else if (sortBy === "plays") {
      result = [...result].sort(
        (a, b) => (b.plays ?? 0) - (a.plays ?? 0)
      );
    }
    return result;
  }, [songs, search, filterInstrument, filterStatus, sortBy]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <p className="text-zinc-500">Please login to discover songs</p>
        <a href="/login" className="px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition">
          Login
        </a>
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
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <input
              type="text"
              placeholder="Search songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600 w-48"
            />
            <select
              value={filterInstrument}
              onChange={(e) => setFilterInstrument(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="">All instruments</option>
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="">All status</option>
              <option value="open">Open</option>
              <option value="uploaded">Uploaded</option>
              <option value="minted">Minted</option>
            </select>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "tracks" | "plays")}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="newest">Newest first</option>
              <option value="tracks">Most tracks</option>
              <option value="plays">Most played</option>
            </select>
            {(search || filterInstrument || filterStatus || filterGenre) && (
              <button
                onClick={() => { setSearch(""); setFilterInstrument(""); setFilterStatus(""); setFilterGenre(""); }}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-white transition"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <SongGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-lg mb-2">
                {songs.length === 0 ? "No songs yet" : "No matching songs"}
              </p>
              <p className="text-zinc-600 text-sm mb-4">
                {songs.length === 0 ? "Be the first to create one!" : "Try different filters"}
              </p>
              {songs.length === 0 && (
                <a href="/main" className="inline-block px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition">
                  Create a Song
                </a>
              )}
            </div>
          ) : (
            <SongList songs={filtered} />
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
