"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";

interface Comment {
  id: number;
  body: string;
  userId: string;
  userName: string | null;
  userAddress: string | null;
  createdAt: number;
}

interface CommentsProps {
  songId: number;
}

export function Comments({ songId }: CommentsProps) {
  const { userId, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(() => {
    fetch(`/api/songs/${songId}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, [songId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/songs/${songId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setBody("");
      toast("Comment posted", "success");
    } catch {
      toast("Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = (c: Comment) =>
    c.userName ??
    (c.userAddress
      ? `${c.userAddress.slice(0, 6)}...${c.userAddress.slice(-4)}`
      : "Anonymous");

  const timeAgo = (ts: number) => {
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Post form */}
      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave feedback..."
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-sm font-medium transition"
          >
            Post
          </button>
        </form>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">
          No comments yet. Be the first to share feedback!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
                {displayName(c).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-300">
                    {displayName(c)}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-0.5 break-words">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
