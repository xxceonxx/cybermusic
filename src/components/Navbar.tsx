"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { isLoggedIn, userName, userId, session } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Cybermusic
          </Link>
          {isLoggedIn && (
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <Link
                href="/main"
                className={`transition ${
                  pathname === "/main"
                    ? "text-white font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/discover"
                className={`transition ${
                  pathname === "/discover"
                    ? "text-white font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Discover
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={isLoggedIn ? "avatar" : "full"}
          />
          {isLoggedIn && userName && userId && (
            <Link
              href={`/profile/${userId}`}
              className="text-sm text-zinc-400 hover:text-white transition hidden sm:block"
            >
              {userName}
            </Link>
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
