import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { isSafeId, sanitizeText, validateUploadMeta, publicError } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  url: z.string().url().max(2000),
  kind: z.enum(["before", "after", "other"]).default("after"),
  mime: z.string().optional(),
  sizeBytes: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isSafeId(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Valid image URL required" }, { status: 400 });
    if (parsed.data.mime && parsed.data.sizeBytes != null) {
      const v = validateUploadMeta({ mime: parsed.data.mime, sizeBytes: parsed.data.sizeBytes, kind: "image" });
      if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    }
    const job = await prisma.job.findUnique({ where: { id }, include: { provider: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const userId = (session.user as { id: string }).id;
    if (job.seekerId !== userId && job.provider?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const photo = await prisma.jobPhoto.create({
      data: {
        jobId: id,
        url: sanitizeText(parsed.data.url, 2000),
        kind: parsed.data.kind,
        uploadedBy: userId,
      },
    });
    return NextResponse.json({ success: true, photo });
  } catch (err: unknown) {
    return NextResponse.json({ error: publicError(err, "Upload register failed") }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSafeId(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  const photos = await prisma.jobPhoto.findMany({ where: { jobId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(photos);
}
