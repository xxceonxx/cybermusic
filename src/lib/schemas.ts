import { z } from "zod";

const INSTRUMENTS = [
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

const SONG_STATUS = ["draft", "open", "minted"] as const;
const TRACK_STATUS = ["open", "editing", "uploaded"] as const;

const ipfsUrl = z.string().url().max(500).refine(
  (s) => /^https?:\/\/.+\/ipfs\/.+/.test(s) || s.startsWith("ipfs://"),
  "Must be an IPFS URL"
);

const ethAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const createSongSchema = z.object({
  name: z.string().trim().min(1).max(200),
  duration: z.number().int().min(1).max(3600),
  bpm: z.number().int().min(20).max(300),
  genre: z.string().trim().max(50).optional().nullable(),
});

export const patchSongSchema = z
  .object({
    status: z.enum(SONG_STATUS).optional(),
    ipfs_url: ipfsUrl.optional(),
    meta_url: z.string().url().max(500).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    image: z.string().url().max(500).optional(),
    bpm: z.number().int().min(20).max(300).optional(),
    genre: z.string().trim().max(50).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, "No fields to update");

export const createTrackSchema = z.object({
  songId: z.number().int().positive(),
  instrument: z.enum(INSTRUMENTS),
});

export const uploadTrackSchema = z.object({
  ipfsUrl: ipfsUrl,
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export const connectWalletSchema = z.object({
  address: ethAddress,
});

export const walletAuthSchema = z.object({
  address: ethAddress,
});

export const tracksQuerySchema = z.object({
  status: z.enum(TRACK_STATUS).optional(),
  instrument: z
    .string()
    .max(200)
    .optional()
    .transform((s) => (s ? s.split(",").filter(Boolean) : undefined))
    .refine(
      (arr) =>
        !arr || arr.every((i) => (INSTRUMENTS as readonly string[]).includes(i)),
      "Invalid instrument"
    ),
});

export const songsQuerySchema = z.object({
  creator: z.string().uuid().optional(),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type PatchSongInput = z.infer<typeof patchSongSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UploadTrackInput = z.infer<typeof uploadTrackSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
