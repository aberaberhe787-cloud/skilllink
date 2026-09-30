import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import {
  communityPostSchema,
  sanitizeText,
  rateLimit,
  clientIp,
  publicError,
} from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const neighborhood = sanitizeText(
      req.nextUrl.searchParams.get("neighborhood") || "",
      60
    );
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

    const ip = clientIp(req);
    const rl = rateLimit(`community:${session.user.id}:${ip}`, 15, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many posts. Slow down." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = communityPostSchema.safeParse({
      title: sanitizeText(body?.title, 120),
      body: sanitizeText(body?.body, 4000),
      category: body?.category,
      neighborhood: body?.neighborhood
        ? sanitizeText(body.neighborhood, 60)
        : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid post", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const post = await prisma.communityPost.create({
      data: {
        authorId: session.user.id as string,
        title: parsed.data.title,
        body: parsed.data.body,
        category: parsed.data.category || "general",
        neighborhood: parsed.data.neighborhood || null,
      },
      include: {
        author: { select: { name: true } },
        replies: true,
      },
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: publicError(e, "Failed to post") },
      { status: 500 }
    );
  }
}
