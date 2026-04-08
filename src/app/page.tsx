"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChooseInstrument } from "@/components/SlotMachine/ChooseInstrument";
import { SlotMachine } from "@/components/SlotMachine/SlotMachine";
import type { Instrument } from "@/types";

export default function Home() {
  const { data: session } = useSession();
  const [locked, setLocked] = useState<Instrument[]>([]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-center">
          Cyber Music Workbench
        </h1>
        <p className="mt-4 text-xl text-zinc-400 text-center max-w-md">
          Create music with people around the world!
        </p>
        <p className="mt-8 text-zinc-500">Login to start creating music</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-2">
        Cyber Music Workbench
      </h1>
      <p className="text-zinc-400 text-center mb-8">
        Create Music with people around the world!
      </p>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <ChooseInstrument onLock={setLocked} locked={locked} />
        <SlotMachine lockedInstruments={locked} />
      </div>

      <div className="mt-12 flex justify-center gap-4">
        <Link
          href="/main"
          className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition"
        >
          My Songs
        </Link>
        <Link
          href="/overview"
          className="px-6 py-2.5 border border-zinc-700 rounded-full font-medium hover:bg-zinc-800 transition"
        >
          Browse All
        </Link>
      </div>
    </div>
  );
}
