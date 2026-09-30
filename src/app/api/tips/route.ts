import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

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
    const tip = await prisma.tip.create({
      data: {
        jobId,
        fromUserId: session.user.id as string,
        toUserId,
        amountKes: Number(amountKes),
      },
    });
    const wallet = await prisma.wallet.findUnique({ where: { userId: toUserId } });
    if (wallet) {
      await prisma.wallet.update({
        where: { userId: toUserId },
        data: { balanceKes: { increment: Number(amountKes) } },
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "tip",
          amountKes: Number(amountKes),
          description: "Customer tip",
          jobId,
        },
      });
    }
    return NextResponse.json(tip);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
