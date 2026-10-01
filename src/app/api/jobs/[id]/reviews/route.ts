import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { isSafeId, sanitizeText, publicError, rateLimit, clientIp } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  toUserId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isSafeId(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  const userId = (session.user as { id: string }).id;
  if (!rateLimit(`review:${userId}:${clientIp(req)}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Rating 1–5 required" }, { status: 400 });
    const job = await prisma.job.findUnique({ where: { id }, include: { provider: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.seekerId !== userId && job.provider?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (job.status !== "completed") {
      return NextResponse.json({ error: "Job must be completed first" }, { status: 400 });
    }
    const toUserId =
      parsed.data.toUserId ||
      (job.seekerId === userId ? job.provider?.userId : job.seekerId);
    if (!toUserId) return NextResponse.json({ error: "No recipient" }, { status: 400 });
    const review = await prisma.review.create({
      data: {
        jobId: id,
        fromUserId: userId,
        toUserId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ? sanitizeText(parsed.data.comment, 1000) : undefined,
      },
    });
    if (job.provider && toUserId === job.provider.userId) {
      const agg = await prisma.review.aggregate({
        where: { toUserId },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.providerProfile.update({
        where: { id: job.provider.id },
        data: { rating: agg._avg.rating || parsed.data.rating, reviewCount: agg._count },
      });
    }
    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    return NextResponse.json({ error: publicError(err, "Review failed") }, { status: 500 });
  }
}
