import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { notifyJobParties, WhatsAppEvent } from "@/lib/whatsapp";

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
  const body = await req.json();
  const status = body.status as string | undefined;

  if (!status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        seeker: true,
        provider: { include: { user: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
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
        extra: body.reason,
      });
    }

    return NextResponse.json({ success: true, job: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
