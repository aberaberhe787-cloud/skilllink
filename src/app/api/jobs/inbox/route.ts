import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

/** Assigned jobs + open marketplace jobs (phones hidden until assigned) */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json([]);
  }

  const assigned = await prisma.job.findMany({
    where: { providerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { seeker: { select: { name: true, phone: true } } },
  });

  const open = await prisma.job.findMany({
    where: {
      providerId: null,
      status: { in: ["open", "requested"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { seeker: { select: { name: true, phone: true } } },
  });

  const seen = new Set<string>();
  const merged = [];
  for (const j of [...assigned, ...open]) {
    if (seen.has(j.id)) continue;
    seen.add(j.id);
    merged.push({
      ...j,
      seeker:
        j.providerId === profile.id
          ? j.seeker
          : { name: j.seeker?.name || null, phone: null },
    });
  }

  return NextResponse.json(merged);
}
