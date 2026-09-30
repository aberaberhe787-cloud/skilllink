import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const verifiedOnly = searchParams.get("verified") === "true";
  const availableOnly = searchParams.get("available") !== "false";

  try {
    const profiles = await prisma.providerProfile.findMany({
      where: {
        ...(verifiedOnly ? { isVerified: true } : {}),
        ...(availableOnly ? { isAvailable: true } : {}),
        ...(category ? { skills: { some: { category } } } : {}),
      },
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
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    });

    const providers = profiles.map((p) => ({
      id: p.id,
      name: p.user.name || "Technician",
      email: p.user.email || "",
      role: "provider" as const,
      avatar: p.user.image || `https://i.pravatar.cc/150?u=${p.user.id}`,
      phone: p.user.phone || undefined,
      location: p.lat && p.lng
        ? { lat: p.lat, lng: p.lng, address: p.address || "" }
        : undefined,
      createdAt: p.createdAt.toISOString(),
      skills: p.skills.map((s) => s.category),
      experienceYears: p.experienceYears,
      bio: p.bio || "",
      serviceRadiusKm: p.serviceRadiusKm,
      fixedRates: Object.fromEntries(
        p.rates.map((r) => [r.category, r.amount])
      ),
      isVerified: p.isVerified,
      verificationStatus: p.verificationStatus as any,
      badges: JSON.parse(p.badges || "[]"),
      rating: p.rating,
      reviewCount: p.reviewCount,
      completionRate: p.completionRate,
      responseTimeMinutes: p.responseTimeMinutes,
      isAvailable: p.isAvailable,
      totalJobsCompleted: p.totalJobsCompleted,
    }));

    return NextResponse.json(providers);
  } catch (err: any) {
    console.error("Providers API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load providers" },
      { status: 500 }
    );
  }
}
