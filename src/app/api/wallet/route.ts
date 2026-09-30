import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId },
        include: { transactions: true },
      });
    }
    return NextResponse.json({
      balanceKes: wallet.balanceKes,
      pendingKes: wallet.pendingKes,
      transactions: wallet.transactions,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
