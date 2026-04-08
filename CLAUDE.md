# Cybermusic

Web3 music collaboration platform — users create songs, add instrument tracks collaboratively, and mint the result as NFTs. Originally built for ethglobal hackathon.

## Stack
- **Frontend**: React / Next.js / TypeScript / Tailwind CSS
- **Auth**: Auth.js (next-auth) — dual: SIWE (Wallet) + Email/OAuth (Google/GitHub)
- **Wallet (optional)**: wagmi + viem + RainbowKit + WalletConnect
- **Hosting**: Cloudflare Pages + Workers
- **Database**: Cloudflare D1 (SQLite)
- **On-Chain**: Solidity ERC-1155 on Base (Hardhat) — only for NFT minting
- **Storage**: IPFS via Pinata (uploads proxied through API route)

## Architecture
Hybrid: off-chain collaboration (D1), on-chain ownership (NFT mint only).
- Songs, tracks, user data, slot machine matching = D1 (instant, free)
- NFT minting = smart contract on Base (single wallet interaction, **optional**)
- Audio files = IPFS via Pinata
- API key protection = Cloudflare Worker proxy
- **Wallet is optional**: users can collaborate fully without a wallet (Email/OAuth login). Wallet only needed for NFT minting. Users can connect a wallet later at any time.

## Structure
- `app/` — Next.js App Router pages (index, main, overview, song/[id])
- `components/` — React components (Song/, SlotMachine/, Button/)
- `hooks/` — Custom hooks (useAuth, useWallet, useApi, useIpfs, useContract, useAudioMixer, useSlotMachine, usePlayer)
- `app/api/` — Next.js Route Handlers → Cloudflare Workers (API + SIWE + Pinata proxy)
- `contracts/` — Hardhat project with CyberMusic.sol
- `public/` — Instrument images, Rive animations, SVGs

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Contract test: `cd contracts && npx hardhat test`
- Deploy contract: `cd contracts && npx hardhat run scripts/deploy.ts --network base-sepolia`
- DB migration: `npx wrangler d1 execute cybermusic --file=db/migrations/001_init.sql`

## Verification
After every change, run in this order:
1. `npx tsc --noEmit` — fix type errors
2. `npm run dev` — verify it works in browser
3. For contract changes: `cd contracts && npx hardhat test`

## Conventions
- React components: functional components with TypeScript
- Hooks for all business logic (`hooks/useAuth.ts`, etc.)
- Server-side: Next.js Route Handlers for API endpoints
- Auth via Auth.js — supports SIWE (wallet) and Email/OAuth providers
- Wallet is optional — never gate collaboration features behind wallet
- Smart contract interactions ONLY in `hooks/useContract.ts`
- User identity = Auth.js session (UUID), NOT wallet address
- For stack-specific guidance, see `docs/` directory

## Don't
- NEVER store Pinata API key in frontend code — always proxy through API route
- NEVER put collaboration logic on-chain — only NFT minting goes on-chain
- NEVER require a wallet for non-NFT features — collaboration must work without wallet
- NEVER use wallet address as primary user ID — use Auth.js session UUID
- NEVER import from the old `services/useMoralis.js` — it's dead code on `main` branch
- NEVER use `pages/` router — use App Router (`app/`) only
