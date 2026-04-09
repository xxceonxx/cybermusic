"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-center">
        Cyber Music Workbench
      </h1>
      <p className="mt-4 text-xl text-zinc-400 text-center max-w-lg">
        Create music with people around the world. Start a song, invite
        collaborators, and mint the result as an NFT.
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        {isLoggedIn ? (
          <>
            <Link
              href="/main"
              className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition text-center"
            >
              My Songs
            </Link>
            <Link
              href="/discover"
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full font-medium hover:from-yellow-400 hover:to-orange-400 transition text-center"
            >
              Discover & Collaborate
            </Link>
          </>
        ) : (
          <div className="text-center">
            <p className="text-zinc-500 mb-4">
              Connect your wallet or sign in to start
            </p>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-20 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-semibold mb-1">Create a Song</h3>
            <p className="text-sm text-zinc-400">
              Set the BPM, duration, and add instrument slots
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-semibold mb-1">Collaborate</h3>
            <p className="text-sm text-zinc-400">
              Others discover your song and contribute their instruments
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-3">3</div>
            <h3 className="font-semibold mb-1">Mint as NFT</h3>
            <p className="text-sm text-zinc-400">
              Mix all tracks and mint the song on Base (optional)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
