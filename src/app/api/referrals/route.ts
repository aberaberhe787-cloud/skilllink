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
    let referral = await prisma.referral.findFirst({
      where: { referrerId: userId, referredId: null },
    });
    if (!referral) {
      const code = "SL-" + userId.slice(-6).toUpperCase();
      referral = await prisma.referral.create({
        data: { code, referrerId: userId },
      });
    }
    const all = await prisma.referral.findMany({ where: { referrerId: userId } });
    const completed = all.filter((r) => r.status === "completed" || r.status === "rewarded");
    const earnedKes = completed.reduce((s, r) => s + r.rewardKes, 0);
    return NextResponse.json({
      code: referral.code,
      stats: {
        pending: all.filter((r) => r.status === "pending").length,
        completed: completed.length,
        earnedKes,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
