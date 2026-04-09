"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { isLoggedIn, userName, session } = useAuth();

  return (
    <nav className="border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Cybermusic
          </Link>
          {isLoggedIn && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/main" className="hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/discover" className="hover:text-white transition">
                Discover
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={isLoggedIn ? "avatar" : "full"}
          />
          {isLoggedIn && userName && (
            <span className="text-sm text-zinc-400 hidden sm:block">
              {userName}
            </span>
          )}
          {session && (
            <button
              onClick={() => signOut()}
              className="text-sm text-zinc-500 hover:text-white transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
