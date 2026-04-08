"use client";

import { useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const abi = parseAbi([
  "function mint(string calldata metadataUri, uint256 quantity) external returns (uint256)",
  "function uri(uint256 tokenId) external view returns (string memory)",
  "function totalMinted() external view returns (uint256)",
  "event SongMinted(uint256 indexed tokenId, address indexed minter, string metadataUri, uint256 quantity)",
]);

export function useContract() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = useCallback(
    (metadataUri: string, quantity: number) => {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [metadataUri, BigInt(quantity)],
      });
    },
    [writeContract]
  );

  return {
    mint,
    isPending,
    isConfirming,
    isSuccess,
    txHash: hash,
  };
}
