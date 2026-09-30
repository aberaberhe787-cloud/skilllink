import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { providerId } = await req.json();
    if (!providerId) {
      return NextResponse.json({ error: "providerId required" }, { status: 400 });
    }
    const follow = await prisma.follow.upsert({
      where: {
        followerId_providerId: {
          followerId: session.user.id as string,
          providerId,
        },
      },
      create: {
        followerId: session.user.id as string,
        providerId,
      },
      update: {},
    });
    return NextResponse.json(follow);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { providerId } = await req.json();
    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id as string,
        providerId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
