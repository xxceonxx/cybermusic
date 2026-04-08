"use client";

import { useState, useCallback } from "react";

interface UploadResult {
  cid: string;
  url: string;
}

export function useIpfs() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File | Blob): Promise<UploadResult> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ipfs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("IPFS upload failed");
      return res.json();
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadJson = useCallback(async (data: unknown): Promise<UploadResult> => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], "metadata.json", { type: "application/json" });
    return uploadFile(file);
  }, [uploadFile]);

  return { uploading, uploadFile, uploadJson };
}
