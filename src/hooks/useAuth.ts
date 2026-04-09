"use client";

import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";

/**
 * Unified auth hook — user is "logged in" if they have
 * either an Auth.js session (email/OAuth) OR a connected wallet.
 */
export function useAuth() {
  const { data: session, status: sessionStatus } = useSession();
  const { address, isConnected } = useAccount();

  const isLoggedIn = !!session || isConnected;
  const isLoading = sessionStatus === "loading";

  // User identity: Auth.js user ID, or wallet address as fallback
  const userId = session?.user?.id ?? address?.toLowerCase() ?? null;
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
