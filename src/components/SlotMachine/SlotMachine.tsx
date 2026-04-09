"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import { INSTRUMENTS } from "@/types";
import type { Instrument } from "@/types";

interface SlotMachineProps {
  lockedInstruments: Instrument[];
}

function SlotReel({ spinning, result }: { spinning: boolean; result?: string }) {
  const [display, setDisplay] = useState("?");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (spinning) {
      intervalRef.current = setInterval(() => {
        setDisplay(INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)]);
      }, 80);
    } else {
      clearInterval(intervalRef.current);
      if (result) setDisplay(result);
    }
    return () => clearInterval(intervalRef.current);
  }, [spinning, result]);

  return (
    <div className="w-28 h-28 bg-zinc-800 border-2 border-zinc-600 rounded-xl flex items-center justify-center overflow-hidden">
      {display !== "?" ? (
        <div className="flex flex-col items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/instruments/${display}.jpg`}
            alt={display}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <span className="text-xs font-medium">{display}</span>
        </div>
      ) : (
        <span className="text-3xl text-zinc-500">?</span>
      )}
    </div>
  );
}

export function SlotMachine({ lockedInstruments }: SlotMachineProps) {
  const router = useRouter();
  const { spinning, spin } = useSlotMachine();
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [result, setResult] = useState<{
    song: { id: number; name: string };
    instrument: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  const handleSpin = async () => {
    if (lockedInstruments.length === 0 || spinning) return;

    setResult(null);
    setFailed(false);
    setReels(["?", "?", "?"]);

    const match = await spin(lockedInstruments);

    if (match) {
      setReels([match.instrument, match.instrument, match.instrument]);
      setResult({ song: match.song, instrument: match.instrument });
    } else {
      const r = Array.from({ length: 3 }, () =>
        INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)]
      );
      setReels(r);
      setFailed(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Slot Machine Frame */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-zinc-600 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            SLOT MACHINE
          </h3>
        </div>

        {/* Reels */}
        <div className="flex gap-3 mb-6">
          <SlotReel spinning={spinning} result={reels[0]} />
          <SlotReel spinning={spinning} result={reels[1]} />
          <SlotReel spinning={spinning} result={reels[2]} />
        </div>

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={spinning || lockedInstruments.length === 0}
          className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
            spinning
              ? "bg-yellow-600 animate-pulse"
              : lockedInstruments.length === 0
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg hover:shadow-yellow-500/25"
          }`}
        >
          {spinning ? "Spinning..." : "SPIN!"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-zinc-900 border border-green-500/50 rounded-xl p-6 text-center max-w-sm animate-in fade-in">
          <p className="text-2xl mb-2">You play {result.instrument}!</p>
          <p className="text-zinc-400 text-sm mb-4">
            in &quot;{result.song.name}&quot;
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setResult(null);
                setReels(["?", "?", "?"]);
              }}
              className="px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition"
            >
              Pass
            </button>
            <button
              onClick={() => router.push(`/song/${result.song.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition"
            >
              Take it!
            </button>
          </div>
        </div>
      )}

      {failed && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center max-w-sm">
          <p className="text-lg mb-2">No match found</p>
          <p className="text-zinc-400 text-sm">
            Try again with different instruments
          </p>
          <button
            onClick={() => {
              setFailed(false);
              setReels(["?", "?", "?"]);
            }}
            className="mt-4 px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {lockedInstruments.length === 0 && !spinning && (
        <p className="text-zinc-500 text-sm">
          Select at least one instrument above, then hit SPIN!
        </p>
      )}
    </div>
  );
}
