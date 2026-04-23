import { describe, it, expect } from "vitest";
import {
  createSongSchema,
  patchSongSchema,
  createTrackSchema,
  uploadTrackSchema,
  createCommentSchema,
  connectWalletSchema,
  tracksQuerySchema,
} from "./schemas";

describe("createSongSchema", () => {
  it("accepts valid payload", () => {
    expect(() =>
      createSongSchema.parse({ name: "Song", duration: 120, bpm: 120 })
    ).not.toThrow();
  });

  it("trims name and rejects empty", () => {
    expect(() => createSongSchema.parse({ name: "   ", duration: 60, bpm: 120 })).toThrow();
  });

  it("rejects name longer than 200 chars", () => {
    expect(() =>
      createSongSchema.parse({ name: "a".repeat(201), duration: 60, bpm: 120 })
    ).toThrow();
  });

  it("rejects bpm out of range", () => {
    expect(() => createSongSchema.parse({ name: "S", duration: 60, bpm: 19 })).toThrow();
    expect(() => createSongSchema.parse({ name: "S", duration: 60, bpm: 301 })).toThrow();
  });

  it("rejects duration > 3600", () => {
    expect(() =>
      createSongSchema.parse({ name: "S", duration: 3601, bpm: 120 })
    ).toThrow();
  });
});

describe("patchSongSchema", () => {
  it("rejects empty object", () => {
    expect(() => patchSongSchema.parse({})).toThrow();
  });

  it("accepts partial", () => {
    expect(patchSongSchema.parse({ name: "New" })).toEqual({ name: "New" });
  });

  it("rejects unknown status", () => {
    expect(() => patchSongSchema.parse({ status: "bogus" })).toThrow();
  });

  it("validates ipfs url shape", () => {
    expect(() =>
      patchSongSchema.parse({ ipfs_url: "https://example.com/not-ipfs" })
    ).toThrow();
    expect(() =>
      patchSongSchema.parse({
        ipfs_url: "https://gateway.pinata.cloud/ipfs/QmSomething",
      })
    ).not.toThrow();
  });
});

describe("createTrackSchema", () => {
  it("accepts known instrument", () => {
    expect(() =>
      createTrackSchema.parse({ songId: 1, instrument: "Bass" })
    ).not.toThrow();
  });

  it("rejects unknown instrument", () => {
    expect(() =>
      createTrackSchema.parse({ songId: 1, instrument: "Kazoo" })
    ).toThrow();
  });

  it("rejects non-positive songId", () => {
    expect(() =>
      createTrackSchema.parse({ songId: 0, instrument: "Bass" })
    ).toThrow();
  });
});

describe("uploadTrackSchema", () => {
  it("accepts ipfs url", () => {
    expect(() =>
      uploadTrackSchema.parse({
        ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmAbc",
      })
    ).not.toThrow();
  });

  it("rejects non-ipfs url", () => {
    expect(() =>
      uploadTrackSchema.parse({ ipfsUrl: "https://example.com/audio.mp3" })
    ).toThrow();
  });
});

describe("createCommentSchema", () => {
  it("caps at 1000 chars", () => {
    expect(() =>
      createCommentSchema.parse({ body: "a".repeat(1001) })
    ).toThrow();
  });

  it("rejects whitespace-only", () => {
    expect(() => createCommentSchema.parse({ body: "   " })).toThrow();
  });
});

describe("connectWalletSchema", () => {
  it("accepts valid eth address", () => {
    expect(() =>
      connectWalletSchema.parse({
        address: "0x" + "a".repeat(40),
      })
    ).not.toThrow();
  });

  it("rejects malformed address", () => {
    expect(() =>
      connectWalletSchema.parse({ address: "0xnope" })
    ).toThrow();
  });
});

describe("tracksQuerySchema", () => {
  it("splits comma-separated instruments", () => {
    const parsed = tracksQuerySchema.parse({
      status: "open",
      instrument: "Bass,Drums",
    });
    expect(parsed.instrument).toEqual(["Bass", "Drums"]);
  });

  it("rejects unknown instrument", () => {
    expect(() =>
      tracksQuerySchema.parse({ instrument: "Kazoo,Bass" })
    ).toThrow();
  });

  it("accepts empty query", () => {
    expect(() => tracksQuerySchema.parse({})).not.toThrow();
  });
});
