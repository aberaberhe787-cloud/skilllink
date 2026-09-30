import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const p = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        skills: true,
        rates: true,
        jobs: {
          where: { status: "completed" },
          take: 5,
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!p) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { toUserId: p.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        fromUser: { select: { name: true, image: true } },
      },
    });

    const provider = {
      id: p.id,
      userId: p.userId,
      name: p.user.name || "Technician",
      email: p.user.email || "",
      avatar: p.user.image || `https://i.pravatar.cc/150?u=${p.user.id}`,
      phone: p.user.phone,
      bio: p.bio,
      experienceYears: p.experienceYears,
      serviceRadiusKm: p.serviceRadiusKm,
      isVerified: p.isVerified,
      verificationStatus: p.verificationStatus,
      badges: JSON.parse(p.badges || "[]"),
      rating: p.rating,
      reviewCount: p.reviewCount,
      completionRate: p.completionRate,
      responseTimeMinutes: p.responseTimeMinutes,
      isAvailable: p.isAvailable,
      totalJobsCompleted: p.totalJobsCompleted,
      location:
        p.lat && p.lng
          ? { lat: p.lat, lng: p.lng, address: p.address || "" }
          : null,
      skills: p.skills.map((s) => s.category),
      fixedRates: Object.fromEntries(
        p.rates.map((r) => [r.category, r.amount])
      ),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        fromName: r.fromUser.name || "User",
      })),
    };

    return NextResponse.json(provider);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
