"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: number;
  type: string;
  message: string;
  songId: number | null;
  read: number;
  createdAt: number;
}

export function NotificationBell() {
  const { userId, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { "x-user-id": userId },
      });
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "x-user-id": userId },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const timeAgo = (ts: number) => {
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6zm0 16a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-zinc-500 hover:text-white transition"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-8">
                  No notifications yet
                </p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <Link
                    key={n.id}
                    href={n.songId ? `/song/${n.songId}` : "#"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition ${
                      !n.read ? "bg-zinc-800/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
