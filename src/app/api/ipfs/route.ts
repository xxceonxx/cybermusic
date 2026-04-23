import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { withErrors, BadRequest, HttpError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = /^audio\/(webm|mpeg|mp3|wav|ogg|flac|aac|x-m4a|mp4)$/;

export const POST = withErrors(async (req) => {
  rateLimit(req as NextRequest, { limit: 20, windowMs: 5 * 60_000, scope: "ipfs" });
  await requireUserId(req as NextRequest);

  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new HttpError(503, "IPFS not configured");

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) throw BadRequest("No file provided");
  if (file.size === 0) throw BadRequest("File is empty");
  if (file.size > MAX_UPLOAD_BYTES)
    throw BadRequest(`File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)`);
  if (file.type && !ALLOWED_MIME.test(file.type))
    throw BadRequest(`Unsupported file type: ${file.type}`);

  const pinataForm = new FormData();
  pinataForm.append("file", file);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: pinataForm,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[ipfs] Pinata upload failed:", response.status, error);
    throw new HttpError(502, "Pinata upload failed");
  }

  const data = (await response.json()) as { IpfsHash: string };
  return NextResponse.json({
    cid: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
  });
});
