import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: {
          include: {
            skills: true,
            rates: true,
            jobs: {
              orderBy: { createdAt: "desc" },
              take: 20,
              include: {
                seeker: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.providerProfile) {
      return NextResponse.json(
        { error: "No provider profile. Sign up as a technician first." },
        { status: 404 }
      );
    }

    const p = user.providerProfile;
    const completedJobs = p.jobs.filter((j) => j.status === "completed");
    const earnings = completedJobs.reduce((sum, j) => sum + j.providerPayout, 0);
    const courses = await prisma.trainingCourse.findMany({
      orderBy: { level: "asc" },
      take: 6,
    });

    return NextResponse.json({
      id: p.id,
      name: user.name,
      email: user.email,
      avatar: user.image || `https://i.pravatar.cc/150?u=${user.id}`,
      isVerified: p.isVerified,
      verificationStatus: p.verificationStatus,
      badges: JSON.parse(p.badges || "[]"),
      rating: p.rating,
      reviewCount: p.reviewCount,
      completionRate: p.completionRate,
      responseTimeMinutes: p.responseTimeMinutes,
      isAvailable: p.isAvailable,
      totalJobsCompleted: p.totalJobsCompleted,
      experienceYears: p.experienceYears,
      earningsThisMonth: earnings,
      skills: p.skills.map((s) => s.category),
      jobs: p.jobs.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        status: j.status,
        category: j.category,
        price: j.price,
        providerPayout: j.providerPayout,
        address: j.address,
        seekerName: j.seeker?.name,
        createdAt: j.createdAt.toISOString(),
        aiMatchScore: j.aiMatchScore,
      })),
      courses,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
