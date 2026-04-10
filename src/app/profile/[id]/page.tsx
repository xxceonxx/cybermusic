"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SongList } from "@/components/Song/SongList";
import type { Song } from "@/types";

interface UserProfile {
  id: string;
  name: string | null;
  address: string | null;
  authProvider: string;
  createdAt: number;
}

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const { userId } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [contributions, setContributions] = useState<Song[]>([]);
  const [tab, setTab] = useState<"songs" | "contributions">("songs");

  const isOwnProfile = userId === profileId;

  useEffect(() => {
    // Fetch user profile
    fetch(`/api/users/${profileId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => {});

    // Fetch songs created by this user
    fetch(`/api/songs?creator=${profileId}`)
      .then((r) => r.json())
      .then(setSongs)
      .catch(() => {});

    // Fetch songs where user contributed tracks
    fetch(`/api/users/${profileId}/contributions`)
      .then((r) => r.json())
      .then(setContributions)
      .catch(() => {});
  }, [profileId]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center flex-1 text-zinc-500">
        Loading profile...
      </div>
    );
  }

  const displayName =
    profile.name ??
    (profile.address
      ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`
      : "Anonymous");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-zinc-500">
            {songs.length} songs · {contributions.length} contributions
            {profile.address && (
              <span className="ml-2 text-zinc-600">
                {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
              </span>
            )}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Joined {new Date(profile.createdAt * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("songs")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "songs" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
          }`}
        >
          Songs ({songs.length})
        </button>
        <button
          onClick={() => setTab("contributions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "contributions" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
          }`}
        >
          Contributions ({contributions.length})
        </button>
      </div>

      {/* Content */}
      {tab === "songs" && (
        songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <p className="text-zinc-500 text-center py-12">No songs yet</p>
        )
      )}
      {tab === "contributions" && (
        contributions.length > 0 ? (
          <SongList songs={contributions} />
        ) : (
          <p className="text-zinc-500 text-center py-12">No contributions yet</p>
        )
      )}
    </div>
  );
}
