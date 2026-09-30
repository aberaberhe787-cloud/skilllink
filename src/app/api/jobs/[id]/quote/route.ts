import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { getCategoryCap, calculateFees } from "@/lib/payments";
import { isSafeId, sanitizeText, rateLimit, clientIp, publicError } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  quotedPrice: z.number().int().positive(),
  quoteNote: z.string().max(500).optional(),
});

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

  const rl = rateLimit(`quote:${(session.user as { id?: string }).id}:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quote" }, { status: 400 });
    }

    let { quotedPrice, quoteNote } = parsed.data;
    if (quoteNote) quoteNote = sanitizeText(quoteNote, 500);

    const job = await prisma.job.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const userId = (session.user as { id: string }).id;
    const role = (session.user as { role?: string }).role;
    const isAssignedProvider = job.provider?.userId === userId;
    let providerProfile = job.provider;

    if (!isAssignedProvider && role !== "admin") {
      providerProfile = await prisma.providerProfile.findUnique({ where: { userId } });
      if (!providerProfile) {
        return NextResponse.json({ error: "Only technicians can submit quotes" }, { status: 403 });
      }
    }

    const cap = await getCategoryCap(job.category);
    if (quotedPrice > cap.maxKes) {
      return NextResponse.json(
        {
          error: `Quote exceeds SkillLink max for this skill (KES ${cap.maxKes.toLocaleString()})`,
          maxKes: cap.maxKes,
          minKes: cap.minKes,
        },
        { status: 400 }
      );
    }
    if (quotedPrice < cap.minKes) {
      return NextResponse.json(
        {
          error: `Quote below minimum (KES ${cap.minKes.toLocaleString()})`,
          maxKes: cap.maxKes,
          minKes: cap.minKes,
        },
        { status: 400 }
      );
    }

    const { platformFee, providerPayout } = calculateFees(quotedPrice);

    const updated = await prisma.job.update({
      where: { id },
      data: {
        quotedPrice,
        quoteNote: quoteNote || null,
        quotedAt: new Date(),
        price: quotedPrice,
        platformFee,
        providerPayout,
        providerId: job.providerId || providerProfile?.id,
        status:
          job.status === "open" || job.status === "requested" ? "quoted" : job.status,
      },
    });

    return NextResponse.json({
      success: true,
      job: updated,
      cap,
      fees: { platformFee, providerPayout, percent: 10 },
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: publicError(err, "Quote failed") }, { status: 500 });
  }
}
