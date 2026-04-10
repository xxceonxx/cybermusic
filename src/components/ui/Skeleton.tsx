"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-800/60 ${className}`}
    />
  );
}

export function SongCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <Skeleton className="h-32 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SongGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DAWSkeleton() {
  return (
    <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/60">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800/60">
        <Skeleton className="w-8 h-8 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-36 h-8 rounded-md" />
        <div className="flex-1" />
        <Skeleton className="w-20 h-4 rounded" />
      </div>
      <div className="space-y-0">
        {[1, 2].map((i) => (
          <div key={i} className="flex border-b border-zinc-800/30">
            <div className="w-52 p-3 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Skeleton className="w-1 h-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="w-16 h-3" />
                  <Skeleton className="w-10 h-2" />
                </div>
              </div>
            </div>
            <div className="flex-1 p-2">
              <Skeleton className="w-full h-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
