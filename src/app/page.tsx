"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="flex flex-col items-center flex-1 px-4">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center py-20 sm:py-28 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Built on Base &middot; Powered by IPFS
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent leading-tight">
          Make Music
          <br />
          Together
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-lg leading-relaxed">
          Create songs, invite collaborators from around the world, record and mix in the browser, and mint the result as an NFT.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/main"
                className="px-8 py-3.5 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition text-center"
              >
                My Songs
              </Link>
              <Link
                href="/discover"
                className="px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full font-semibold hover:from-yellow-400 hover:to-orange-400 transition text-center"
              >
                Discover
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-8 py-3.5 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition text-center"
              >
                Get Started
              </Link>
              <Link
                href="/discover"
                className="px-8 py-3.5 border border-zinc-700 rounded-full font-medium hover:bg-zinc-900 transition text-center"
              >
                Browse Songs
              </Link>
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="w-full max-w-4xl pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                  <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
                </svg>
              ),
              title: "Create a Song",
              desc: "Set the BPM, duration, and add instrument tracks. Upload audio or record directly in the browser DAW.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
              ),
              title: "Collaborate",
              desc: "Others discover your song via the slot machine or browse, claim a track, and contribute their instrument.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                  <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m6 4h6" strokeLinecap="round" />
                </svg>
              ),
              title: "Export or Mint",
              desc: "Download stems for your DAW, export a master WAV, or mint the finished song as an NFT on Base.",
            },
          ].map((step, i) => (
            <div key={i} className="relative p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="font-semibold mb-1.5">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="w-full max-w-4xl pb-20 border-t border-zinc-800/60 pt-16">
        <h2 className="text-2xl font-bold text-center mb-10">Built for musicians</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Browser DAW", desc: "Record, mix, and preview tracks without leaving the browser" },
            { label: "IPFS Storage", desc: "All audio stored on IPFS — decentralized and permanent" },
            { label: "Stem Export", desc: "Download individual tracks + project info for Ableton, Logic, FL Studio" },
            { label: "Wallet Optional", desc: "Collaborate with email login. Connect a wallet only when you're ready to mint" },
            { label: "Slot Machine", desc: "Fun matching system to discover songs that need your instrument" },
            { label: "On-Chain Ownership", desc: "Mint finished songs as ERC-1155 NFTs on Base (cheap gas)" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
