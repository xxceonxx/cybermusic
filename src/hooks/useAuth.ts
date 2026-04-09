"use client";

import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

/**
 * Unified auth hook — user is "logged in" if they have
 * either an Auth.js session (email/OAuth) OR a connected wallet.
 * Wallet-only users are auto-registered in the DB.
 */
export function useAuth() {
  const { data: session, status: sessionStatus } = useSession();
  const { address, isConnected } = useAccount();
  const [walletUserId, setWalletUserId] = useState<string | null>(null);

  // Auto-register wallet user in DB when wallet connects without Auth.js session
  useEffect(() => {
    if (isConnected && address && !session) {
      fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
        .then((res) => res.json())
        .then((data) => setWalletUserId(data.id))
        .catch(() => {});
    }
    if (!isConnected) {
      setWalletUserId(null);
    }
  }, [isConnected, address, session]);

  const isLoggedIn = !!session || isConnected;
  const isLoading = sessionStatus === "loading";

  const userId = session?.user?.id ?? walletUserId ?? null;
  const userName =
    session?.user?.name ??
    (address ? address.slice(0, 6) + "..." + address.slice(-4) : null);
  const hasWallet = isConnected;

  return {
    isLoggedIn,
    isLoading,
    userId,
    userName,
    hasWallet,
    address,
    session,
  };
}
