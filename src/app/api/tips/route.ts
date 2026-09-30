import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { calculateBonusFees } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { jobId, toUserId, amountKes } = await req.json();
    if (!jobId || !toUserId || !amountKes || amountKes < 50) {
      return NextResponse.json({ error: "Invalid tip" }, { status: 400 });
    }

    const amount = Number(amountKes);
    const { platformFeeKes, providerAmount } = calculateBonusFees(amount);

    const tip = await prisma.tip.create({
      data: {
        jobId,
        fromUserId: session.user.id as string,
        toUserId,
        amountKes: amount,
        platformFeeKes,
        providerAmount,
      },
    });

    let wallet = await prisma.wallet.findUnique({ where: { userId: toUserId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: toUserId, balanceKes: 0 },
      });
    }
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceKes: { increment: providerAmount } },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "tip",
        amountKes: providerAmount,
        description: `Tip/bonus (gross ${amount}, 5% fee ${platformFeeKes})`,
        jobId,
      },
    });

    return NextResponse.json({ tip, fees: { platformFeeKes, providerAmount, percent: 5 } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
