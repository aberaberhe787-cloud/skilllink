import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { notifyJobParties } from "@/lib/whatsapp";
import { isSafeId, sanitizeText, rateLimit, clientIp, publicError } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = clientIp(req);
    const rl = rateLimit(`dispute:${session.user.id}:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const jobId = body.jobId;
    const reason = sanitizeText(body.reason, 2000);

    if (!isSafeId(jobId) || reason.length < 10) {
      return NextResponse.json(
        { error: "Valid job ID and reason (min 10 chars) required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { provider: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const userId = session.user.id as string;
    const role = (session.user as { role?: string }).role;
    const isParticipant =
      job.seekerId === userId || job.provider?.userId === userId;
    if (!isParticipant && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.dispute.findUnique({ where: { jobId } });
    if (existing) {
      return NextResponse.json(
        { error: "A dispute already exists for this job" },
        { status: 409 }
      );
    }

    const dispute = await prisma.dispute.create({
      data: { jobId, openedById: userId, reason },
    });
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "disputed" },
    });

    try {
      const full = await prisma.job.findUnique({
        where: { id: jobId },
        include: { seeker: true, provider: { include: { user: true } } },
      });
      if (full) {
        await notifyJobParties({
          event: "dispute_opened",
          jobId: full.id,
          jobTitle: full.title,
          amountKes: full.price,
          seekerPhone: full.seeker.phone,
          providerPhone: full.provider?.user?.phone,
          seekerName: full.seeker.name,
          providerName: full.provider?.user?.name,
          extra: reason.slice(0, 120),
        });
      }
    } catch (e) {
      console.error("WhatsApp dispute notify failed:", e);
    }

    return NextResponse.json(dispute);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: publicError(e, "Failed to open dispute") },
      { status: 500 }
    );
  }
}
