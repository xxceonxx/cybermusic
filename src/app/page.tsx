"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-center">
        Cyber Music Workbench
      </h1>
      <p className="mt-4 text-xl text-zinc-400 text-center max-w-md">
        Create music with people around the world!
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        {session ? (
          <>
            <Link
              href="/main"
              className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/overview"
              className="px-8 py-3 border border-zinc-700 rounded-full font-medium hover:bg-zinc-800 transition text-center"
            >
              Browse Songs
            </Link>
          </>
        ) : (
          <p className="text-zinc-500">
            Login to start creating music
          </p>
        )}
      </div>
    </div>
  );
}
