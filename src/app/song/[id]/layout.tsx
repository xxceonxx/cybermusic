import { Metadata } from "next";
import { getDb, toCamel } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT name, image, bpm, duration, status FROM songs WHERE id = ?").get(id) as Record<string, unknown> | undefined;

  if (!row) {
    return { title: "Song not found — Cybermusic" };
  }

  const song = toCamel(row) as { name: string; image: string; bpm: number; duration: number; status: string };
  const trackCount = db.prepare("SELECT COUNT(*) as count FROM tracks WHERE song_id = ?").get(id) as { count: number };

  const title = song.name;
  const description = `${song.bpm} BPM · ${song.duration}s · ${trackCount.count} tracks · ${song.status}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: song.image ? [{ url: song.image, width: 600, height: 600 }] : [],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: song.image ? [song.image] : [],
    },
  };
}

export default function SongLayout({ children }: { children: React.ReactNode }) {
  return children;
}
