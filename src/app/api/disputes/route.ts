import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { notifyJobParties } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { jobId, reason } = await req.json();
    if (!jobId || !reason || reason.length < 10) {
      return NextResponse.json({ error: "Job ID and reason required" }, { status: 400 });
    }
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const dispute = await prisma.dispute.create({
      data: {
        jobId,
        openedById: session.user.id as string,
        reason,
      },
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
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
