import type { Song, Track, User } from "@/types";

const COVER_IMAGES = [
  "https://gateway.pinata.cloud/ipfs/QmTSwYWnnB9LW4bCKqyaAg7vrYhdoLLevzAchQaGg3PPzt",
  "https://gateway.pinata.cloud/ipfs/QmTSmz3MWt2F5Kcz4vktxoepLqRg6kwikvb2fus9wWRE6S",
  "https://gateway.pinata.cloud/ipfs/QmXPCTmUoTPUbW1hN5KFNv8pehjUAVxTZ5TQEHLtHCcTUL",
  "https://gateway.pinata.cloud/ipfs/QmX46PtZorWJrzCk34WSitPW4XK6a1S2Gc6BDDgkj115ok",
  "https://gateway.pinata.cloud/ipfs/QmVXcnCyKQ3vSqgsExfuJcuKwSADZ9s66MxjuvRzSLehYG",
  "https://gateway.pinata.cloud/ipfs/QmUS5ukGNj4kbYH6hnfu6Eg6Q9d6GgsEP2gfkjVCQT856p",
  "https://gateway.pinata.cloud/ipfs/QmNfGsPqVaiKfKZNbY48Epdafp4GERJZHgFkazDE9bNPZG",
];

export const mockUsers: User[] = [
  {
    id: "user-1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    email: null,
    name: "CryptoMusician",
    authProvider: "siwe",
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "user-2",
    address: null,
    email: "producer@example.com",
    name: "BeatMaker",
    authProvider: "email",
    createdAt: Date.now() - 86400000 * 3,
  },
];

export const mockTracks: Track[] = [
  {
    id: 1,
    songId: 1,
    instrument: "Bass",
    creatorId: "user-1",
    editorId: null,
    status: "uploaded",
    ipfsUrl: null,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 2,
    songId: 1,
    instrument: "Drums",
    creatorId: "user-1",
    editorId: "user-2",
    status: "editing",
    ipfsUrl: null,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 3,
    songId: 1,
    instrument: "Piano",
    creatorId: "user-1",
    editorId: null,
    status: "open",
    ipfsUrl: null,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 4,
    songId: 2,
    instrument: "EGuitar",
    creatorId: "user-2",
    editorId: null,
    status: "open",
    ipfsUrl: null,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 5,
    songId: 2,
    instrument: "Vocals",
    creatorId: "user-2",
    editorId: null,
    status: "open",
    ipfsUrl: null,
    createdAt: Date.now() - 86400000,
  },
];

export const mockSongs: Song[] = [
  {
    id: 1,
    name: "Cyber Beats Vol. 1",
    duration: 120,
    bpm: 128,
    image: COVER_IMAGES[0],
    creatorId: "user-1",
    status: "open",
    ipfsUrl: null,
    metaUrl: null,
    createdAt: Date.now() - 86400000 * 6,
    tracks: mockTracks.filter((t) => t.songId === 1),
  },
  {
    id: 2,
    name: "Neon Nights",
    duration: 180,
    bpm: 95,
    image: COVER_IMAGES[3],
    creatorId: "user-2",
    status: "open",
    ipfsUrl: null,
    metaUrl: null,
    createdAt: Date.now() - 86400000 * 2,
    tracks: mockTracks.filter((t) => t.songId === 2),
  },
];

export { COVER_IMAGES };
