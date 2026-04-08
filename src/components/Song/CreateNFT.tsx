"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useIpfs } from "@/hooks/useIpfs";
import { useContract } from "@/hooks/useContract";
import { useApi } from "@/hooks/useApi";
import type { Song, Track } from "@/types";

interface CreateNFTProps {
  song: Song;
  tracks: Track[];
}

export function CreateNFT({ song, tracks }: CreateNFTProps) {
  const { isConnected } = useAccount();
  const { mixing, progress, mixTracks } = useAudioMixer();
  const { uploading, uploadFile, uploadJson } = useIpfs();
  const { mint, isPending, isConfirming, isSuccess, txHash } = useContract();
  const { updateSong } = useApi();

  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);

  const uploadedTracks = tracks.filter((t) => t.ipfsUrl);

  // Step 1: Mix all tracks into one audio file
  const handleMix = async () => {
    const trackUrls = uploadedTracks.map((t) => t.ipfsUrl!);
    const blob = await mixTracks({ trackUrls, duration: song.duration });

    const { url } = await uploadFile(blob);
    await updateSong(song.id, { status: "uploaded", ipfs_url: url } as never);
    setStep(2);
  };

  // Step 2: Create metadata JSON and upload to IPFS
  const handleMetadata = async () => {
    const metadata = {
      name: song.name,
      description: `Collaborative song created on Cybermusic`,
      duration: song.duration,
      bpm: song.bpm,
      image: song.image,
      audio: song.ipfsUrl,
      external_url: "https://cybermusic.app",
      attributes: [
        { trait_type: "BPM", value: song.bpm },
        { trait_type: "Duration", value: song.duration },
        { trait_type: "Tracks", value: uploadedTracks.length },
      ],
      tracks: uploadedTracks.map((t) => ({
        instrument: t.instrument,
        audio: t.ipfsUrl,
      })),
    };

    const { url } = await uploadJson(metadata);
    setMetadataUri(url);
    await updateSong(song.id, { status: "meta", meta_url: url } as never);
    setStep(3);
  };

  // Step 3: Mint NFT
  const handleMint = () => {
    if (!metadataUri) return;
    mint(metadataUri, quantity);
  };

  if (uploadedTracks.length === 0) {
    return (
      <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-zinc-500">
        Upload at least one track before minting
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
      <h2 className="text-xl font-bold mb-6">Create NFT</h2>

      {/* Stepper indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s
                  ? "bg-green-600"
                  : step === s
                  ? "bg-white text-black"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-0.5 ${
                  step > s ? "bg-green-600" : "bg-zinc-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Mix */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Mix your Song</h3>
          <p className="text-zinc-400 text-sm mb-4">
            We will mix all {uploadedTracks.length} tracks and upload to IPFS.
            This plays in real-time — don&apos;t close the tab.
          </p>
          {mixing && (
            <div className="mb-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Mixing... {Math.round(progress * 100)}%
              </p>
            </div>
          )}
          <button
            onClick={handleMix}
            disabled={mixing || uploading}
            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-700 rounded-lg font-medium transition"
          >
            {mixing ? "Mixing..." : uploading ? "Uploading..." : "Mix Song"}
          </button>
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Create Metadata</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Your song metadata will be stored on IPFS permanently.
          </p>
          <button
            onClick={handleMetadata}
            disabled={uploading}
            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-700 rounded-lg font-medium transition"
          >
            {uploading ? "Uploading..." : "Create Metadata"}
          </button>
        </div>
      )}

      {/* Step 3: Mint */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Mint NFT</h3>

          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                Your song is ready! Connect a wallet to mint it as an NFT.
              </p>
              <ConnectButton label="Connect Wallet to Mint" />
            </div>
          ) : isSuccess ? (
            <div className="space-y-2">
              <p className="text-green-400 text-lg font-bold">
                Success! Your NFT was minted!
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  View on Basescan
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">
                  Quantity (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="ml-3 w-16 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-center"
                />
              </div>
              <button
                onClick={handleMint}
                disabled={isPending || isConfirming}
                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-700 rounded-lg font-medium transition"
              >
                {isPending
                  ? "Confirm in Wallet..."
                  : isConfirming
                  ? "Confirming..."
                  : "Mint NFT"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
