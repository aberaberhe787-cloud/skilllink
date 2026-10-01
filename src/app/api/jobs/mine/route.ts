import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const jobs = await prisma.job.findMany({
    where: { seekerId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      provider: { include: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json(jobs);
}
