import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const neighborhood = req.nextUrl.searchParams.get("neighborhood");
    const posts = await prisma.communityPost.findMany({
      where: neighborhood && neighborhood !== "All" ? { neighborhood } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { name: true } },
        replies: { select: { id: true } },
      },
    });
    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in to post" }, { status: 401 });
    }
    const body = await req.json();
    const post = await prisma.communityPost.create({
      data: {
        authorId: session.user.id as string,
        title: body.title,
        body: body.body,
        category: body.category || "general",
        neighborhood: body.neighborhood || null,
      },
      include: {
        author: { select: { name: true } },
        replies: true,
      },
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to post" }, { status: 500 });
  }
}
