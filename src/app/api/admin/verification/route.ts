import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.providerProfile.findMany({
    where: {
      verificationStatus: { in: ["pending", "needs_info"] },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      skills: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(pending);
}

const actionSchema = z.object({
  providerProfileId: z.string(),
  action: z.enum(["approve", "reject", "needs_info"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { providerProfileId, action } = parsed.data;

    let verificationStatus = "pending";
    let isVerified = false;

    if (action === "approve") {
      verificationStatus = "approved";
      isVerified = true;
    } else if (action === "reject") {
      verificationStatus = "rejected";
      isVerified = false;
    } else {
      verificationStatus = "needs_info";
      isVerified = false;
    }

    const updated = await prisma.providerProfile.update({
      where: { id: providerProfileId },
      data: { verificationStatus, isVerified },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
