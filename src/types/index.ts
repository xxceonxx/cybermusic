export const INSTRUMENTS = [
  "Bass",
  "AGuitar",
  "EGuitar",
  "Drums",
  "Harp",
  "Flute",
  "Percussion",
  "Piano",
  "Saxophone",
  "Triangle",
  "Violine",
  "Vocals",
] as const;

export type Instrument = (typeof INSTRUMENTS)[number];

export type SongStatus = "open" | "uploaded" | "meta" | "minted";
export type TrackStatus = "open" | "editing" | "uploaded";
export type AuthProvider = "siwe" | "email" | "google" | "github";

export interface User {
  id: string;
  address?: string | null;
  email?: string | null;
  name?: string | null;
  authProvider: AuthProvider;
  createdAt: number;
}

export interface Song {
  id: number;
  name: string;
  duration: number;
  bpm: number;
  image: string;
  creatorId: string;
  status: SongStatus;
  ipfsUrl?: string | null;
  metaUrl?: string | null;
  createdAt: number;
  tracks?: Track[];
}

export interface Track {
  id: number;
  songId: number;
  instrument: Instrument;
  creatorId: string;
  editorId?: string | null;
  editorName?: string | null;
  editorAddress?: string | null;
  status: TrackStatus;
  ipfsUrl?: string | null;
  createdAt: number;
}
