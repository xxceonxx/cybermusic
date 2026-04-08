"use client";

import { useState } from "react";
import { INSTRUMENTS } from "@/types";
import type { Instrument } from "@/types";

interface ChooseInstrumentProps {
  onLock: (instruments: Instrument[]) => void;
  locked: Instrument[];
}

export function ChooseInstrument({ onLock, locked }: ChooseInstrumentProps) {
  const [selected, setSelected] = useState<Set<Instrument>>(new Set(locked));

  const toggle = (inst: Instrument) => {
    const next = new Set(selected);
    if (next.has(inst)) {
      next.delete(inst);
    } else {
      next.add(inst);
    }
    setSelected(next);
    onLock(Array.from(next));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-green-400 mb-4 text-center">
        Choose your instruments
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {INSTRUMENTS.map((inst) => {
          const isLocked = selected.has(inst);
          return (
            <button
              key={inst}
              onClick={() => toggle(inst)}
              className={`relative rounded-xl overflow-hidden border-2 transition ${
                isLocked
                  ? "border-green-500 ring-2 ring-green-500/30"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/instruments/${inst}${isLocked ? "-xl-greyscale" : "-xl"}.jpg`}
                alt={inst}
                className="w-full aspect-square object-cover"
              />
              <span
                className={`absolute bottom-0 inset-x-0 py-1 text-xs font-medium text-center ${
                  isLocked ? "bg-green-600" : "bg-black/60"
                }`}
              >
                {inst}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
