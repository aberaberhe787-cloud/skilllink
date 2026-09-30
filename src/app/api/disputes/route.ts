import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

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
    return NextResponse.json(dispute);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
