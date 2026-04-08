# Cybermusic

Web3 music collaboration platform. Create songs with people around the world, then mint the result as an NFT.

Originally built for an [ethglobal hackathon](https://github.com/xxceonxx/cybermusic). This is the v2 rewrite with a modern stack.

## How it works

1. **Create a Song** — Set name, BPM, and duration
2. **Add Instrument Tracks** — Bass, Guitar, Drums, Piano, Vocals, and more
3. **Slot Machine** — Spin to get matched to an open track in someone else's song
4. **Upload Audio** — Record or upload your instrument contribution
5. **Mix** — All tracks get mixed in the browser
6. **Mint NFT** — Optionally mint the finished song as an ERC-1155 NFT on Base

Wallet is **optional** — you can collaborate without one. Only the NFT mint step requires a wallet.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Next.js 16, TypeScript, Tailwind CSS |
| Auth | Auth.js (SIWE wallet + Email/OAuth) |
| Wallet | wagmi, viem, RainbowKit, WalletConnect |
| Database | SQLite (local) / Cloudflare D1 (production) |
| Storage | IPFS via Pinata |
| Smart Contract | Solidity ERC-1155, Hardhat, Base chain |
| Hosting | Cloudflare Pages |

## Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, NEXTAUTH_SECRET, PINATA_JWT

# Run dev server
npm run dev

# Open http://localhost:3000
```

### Smart Contract

```bash
cd contracts
npm install

# Run tests
npx hardhat test

# Deploy to Base Sepolia
DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts --network base-sepolia
```

## Project Structure

```
src/
  app/              — Next.js App Router pages
    api/            — API route handlers (songs, tracks, auth, IPFS)
  components/       — React components
    Song/           — SongList, TrackList, NewSong, AddTrack, CreateNFT
    SlotMachine/    — ChooseInstrument, SlotMachine (Rive animation)
  hooks/            — Custom hooks (useApi, useContract, usePlayer, etc.)
  types/            — TypeScript types
  config/           — wagmi config, contract ABI

contracts/          — Hardhat project
  contracts/        — CyberMusic.sol (ERC-1155)
  test/             — Contract tests (8 tests)
  scripts/          — Deploy script

db/
  migrations/       — D1/SQLite schema
```

## Architecture

**Hybrid: off-chain collaboration, on-chain ownership.**

- Song/track creation, slot machine matching → instant, free (SQLite/D1)
- Audio files → IPFS via Pinata (proxied through API route)
- NFT minting → smart contract on Base (single wallet transaction)
- Auth → dual: wallet (SIWE) or email/OAuth. Wallet can be connected later.
