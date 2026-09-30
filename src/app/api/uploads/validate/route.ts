import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { validateUploadMeta, rateLimit, clientIp } from "@/lib/security";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`upload:${(session.user as { id?: string }).id}:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const result = validateUploadMeta({
      mime: String(body.mime || ""),
      sizeBytes: Number(body.sizeBytes || 0),
      kind: body.kind === "document" ? "document" : "image",
      maxBytes: body.maxBytes,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      policy: {
        maxBytes: 5 * 1024 * 1024,
        allowedImageMime: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        allowedDocMime: ["application/pdf", "image/jpeg", "image/png"],
        note: "Virus scanning not included in-app; use storage provider scanning in production.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
