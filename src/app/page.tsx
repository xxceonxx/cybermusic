"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-8 py-32 px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Cyber Music Workbench
        </h1>
        <h2 className="text-xl text-zinc-400">
          Create Music with people around the world!
        </h2>
        <ConnectButton />
      </main>
    </div>
  );
}
