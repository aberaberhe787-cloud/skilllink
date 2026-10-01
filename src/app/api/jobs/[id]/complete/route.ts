import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { markPaymentHeld, releasePaymentToWallet } from "@/lib/payments";
import { isSafeId, publicError } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  as: z.enum(["provider", "seeker"]).default("seeker"),
  markHeldFirst: z.boolean().optional(),
});

/** Provider marks done; seeker confirms → release 90% to wallet */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isSafeId(id)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const as = parsed.success ? parsed.data.as : "seeker";
    const markHeldFirst = parsed.success ? parsed.data.markHeldFirst : false;

    const userId = (session.user as { id: string }).id;
    const job = await prisma.job.findUnique({
      where: { id },
      include: { provider: true, payment: true, seeker: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const isSeeker = job.seekerId === userId;
    const isProvider = job.provider?.userId === userId;
    const isAdmin = (session.user as { role?: string }).role === "admin";

    if (as === "provider") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const updated = await prisma.job.update({
        where: { id },
        data: { status: "completed", completedAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        job: updated,
        message: "Marked complete. Waiting for customer to confirm and release payment.",
      });
    }

    if (!isSeeker && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (job.payment && markHeldFirst && job.payment.status === "pending") {
      await markPaymentHeld(job.payment.id);
    }

    if (job.payment) {
      const p = await prisma.payment.findUnique({ where: { id: job.payment.id } });
      if (p && p.status === "pending") {
        await markPaymentHeld(p.id);
      }
    }

    await prisma.job.update({
      where: { id },
      data: { status: "completed", completedAt: job.completedAt || new Date() },
    });

    let payment = null;
    try {
      payment = await releasePaymentToWallet(id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Release failed";
      return NextResponse.json(
        { success: true, jobCompleted: true, paymentReleased: false, warning: msg },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      jobCompleted: true,
      paymentReleased: true,
      payment,
      currency: "ETB",
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: publicError(err, "Complete failed") }, { status: 500 });
  }
}
