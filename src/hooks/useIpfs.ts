"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";

interface UploadResult {
  cid: string;
  url: string;
}

export function useIpfs() {
  const [uploading, setUploading] = useState(false);
  const { userId } = useAuth();

  const uploadFile = useCallback(async (file: File | Blob): Promise<UploadResult> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ipfs", {
        method: "POST",
        headers: userId ? { "x-user-id": userId } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `IPFS upload failed (${res.status})`);
      }
      return res.json();
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const uploadJson = useCallback(async (data: unknown): Promise<UploadResult> => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], "metadata.json", { type: "application/json" });
    return uploadFile(file);
  }, [uploadFile]);

  return { uploading, uploadFile, uploadJson };
}
