import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// POST /api/ipfs — Proxy upload to Pinata (protects API key)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "IPFS not configured" },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

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
    return NextResponse.json(
      { error: "Pinata upload failed", details: error },
      { status: 502 }
    );
  }

  const data = await response.json();
  return NextResponse.json({
    cid: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
  });
}
