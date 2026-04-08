"use client";

import { useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { useRouter } from "next/navigation";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import type { Instrument } from "@/types";

interface SlotMachineProps {
  lockedInstruments: Instrument[];
}

export function SlotMachine({ lockedInstruments }: SlotMachineProps) {
  const router = useRouter();
  const { spinning, spin } = useSlotMachine();
  const [result, setResult] = useState<{
    song: { id: number; name: string };
    instrument: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  const { RiveComponent, rive } = useRive({
    src: "/rive/casino-slot-machine.riv",
    autoplay: true,
    animations: ["Wait"],
  });

  const handleSpin = async () => {
    if (lockedInstruments.length === 0) return;

    setResult(null);
    setFailed(false);

    const match = await spin(lockedInstruments);

    if (match) {
      rive?.play(match.instrument);
      setTimeout(() => {
        setResult({ song: match.song, instrument: match.instrument });
      }, 3000);
    } else {
      rive?.play("fail");
      setTimeout(() => setFailed(true), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onClick={handleSpin}
        className="cursor-pointer hover:scale-105 transition-transform"
        style={{ width: 400, height: 400 }}
      >
        <RiveComponent />
      </div>

      {spinning && (
        <p className="text-zinc-400 animate-pulse">Searching for a match...</p>
      )}

      {result && (
        <div className="bg-zinc-900 border border-green-500/50 rounded-xl p-6 text-center max-w-sm">
          <p className="text-2xl mb-2">You play {result.instrument}!</p>
          <p className="text-zinc-400 text-sm mb-4">
            in &quot;{result.song.name}&quot;
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setResult(null);
                rive?.play("Wait");
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
              rive?.play("Wait");
            }}
            className="mt-4 px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {lockedInstruments.length === 0 && !spinning && (
        <p className="text-zinc-500 text-sm">
          Select at least one instrument above, then click the machine!
        </p>
      )}
    </div>
  );
}
