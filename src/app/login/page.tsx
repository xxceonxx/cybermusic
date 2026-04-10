"use client";

import { signIn } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn) router.push("/main");
  }, [isLoggedIn, isLoading, router]);

  return (
    <div className="flex items-center justify-center flex-1 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Sign in to start making music
          </p>
        </div>

        {/* Wallet — primary method */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
          <p className="text-xs text-zinc-500 mb-3 text-center">
            Recommended — instantly sign in with your wallet
          </p>
          <div className="flex justify-center">
            <ConnectButton label="Connect Wallet" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-600 text-xs">
          <div className="flex-1 h-px bg-zinc-800" />
          or sign in with
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Email + GitHub */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn("email", { email, password, callbackUrl: "/main" });
            }}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition"
            >
              Sign in with Email
            </button>
          </form>

          <button
            onClick={() => signIn("github", { callbackUrl: "/main" })}
            className="w-full py-2.5 border border-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-900 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
          No wallet? No problem. You can collaborate with email login.
          <br />
          A wallet is only needed to mint NFTs.
        </p>
      </div>
    </div>
  );
}
