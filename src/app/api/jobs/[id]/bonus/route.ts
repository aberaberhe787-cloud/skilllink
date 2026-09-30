import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { calculateBonusFees } from "@/lib/payments";
import { isSafeId, rateLimit, clientIp, publicError } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  amountKes: z.number().int().min(50).max(100_000),
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

  const userId = (session.user as { id: string }).id;
  const rl = rateLimit(`bonus:${userId}:${clientIp(req)}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bonus must be KES 50–100,000" }, { status: 400 });
    }
    const { amountKes } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.seekerId !== userId && (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Only the customer can add a bonus" }, { status: 403 });
    }

    if (!job.provider?.userId) {
      return NextResponse.json({ error: "No technician assigned yet" }, { status: 400 });
    }

    const { platformFeeKes, providerAmount } = calculateBonusFees(amountKes);

    const tip = await prisma.tip.create({
      data: {
        jobId: id,
        fromUserId: userId,
        toUserId: job.provider.userId,
        amountKes,
        platformFeeKes,
        providerAmount,
      },
    });

    let wallet = await prisma.wallet.findUnique({ where: { userId: job.provider.userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: job.provider.userId, balanceKes: 0 },
      });
    }
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceKes: { increment: providerAmount } },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "bonus",
        amountKes: providerAmount,
        description: `Customer bonus (KES ${amountKes}, platform 5% = ${platformFeeKes})`,
        jobId: id,
      },
    });

    return NextResponse.json({
      success: true,
      tip,
      fees: { amountKes, platformFeeKes, providerAmount, percent: 5 },
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: publicError(err, "Bonus failed") }, { status: 500 });
  }
}
