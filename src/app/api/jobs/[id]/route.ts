import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { notifyJobParties, WhatsAppEvent } from "@/lib/whatsapp";
import { isSafeId, jobStatusSchema, sanitizeText, publicError } from "@/lib/security";

const STATUS_TO_EVENT: Record<string, WhatsAppEvent> = {
  accepted: "job_accepted",
  in_progress: "job_in_progress",
  completed: "job_completed",
  disputed: "dispute_opened",
};

export async function PATCH(
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

  let body: { status?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const statusParsed = jobStatusSchema.safeParse(body.status);
  if (!statusParsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const status = statusParsed.data;
  const reason = body.reason ? sanitizeText(body.reason, 500) : undefined;

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { seeker: true, provider: { include: { user: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;
    const isSeeker = job.seekerId === userId;
    const isProvider = job.provider?.userId === userId;
    const isAdmin = role === "admin";

    if (!isSeeker && !isProvider && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if ((status === "accepted" || status === "in_progress") && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: "Only the assigned technician can set this status" },
        { status: 403 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : undefined,
      },
    });

    const event = STATUS_TO_EVENT[status];
    if (event) {
      await notifyJobParties({
        event,
        jobId: job.id,
        jobTitle: job.title,
        amountKes: job.price,
        seekerPhone: job.seeker.phone,
        providerPhone: job.provider?.user?.phone,
        seekerName: job.seeker.name,
        providerName: job.provider?.user?.name,
        extra: reason,
      });
    }

    return NextResponse.json({ success: true, job: updated });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: publicError(err, "Update failed") }, { status: 500 });
  }
}
