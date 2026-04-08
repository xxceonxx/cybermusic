"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSession, signIn, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Cybermusic
          </Link>
          {session && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/main" className="hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/overview" className="hover:text-white transition">
                Songs
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus="avatar"
              />
              <span className="text-sm text-zinc-400 hidden sm:block">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-zinc-500 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signIn("email")}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
              >
                Login with Email
              </button>
              <ConnectButton label="Login with Wallet" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
