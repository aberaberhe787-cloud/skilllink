import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json([]);
  const jobs = await prisma.job.findMany({
    where: { providerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { seeker: { select: { name: true, phone: true } } },
  });
  return NextResponse.json(jobs);
}
