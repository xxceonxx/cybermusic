import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-20">
      <div className="text-6xl font-bold text-zinc-800 mb-2">404</div>
      <h1 className="text-xl font-semibold mb-2">Page not found</h1>
      <p className="text-zinc-500 text-sm mb-6 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition text-sm"
        >
          Home
        </Link>
        <Link
          href="/discover"
          className="px-5 py-2.5 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition text-sm"
        >
          Discover Songs
        </Link>
      </div>
    </div>
  );
}
