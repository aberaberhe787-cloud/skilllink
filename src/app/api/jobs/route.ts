import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { calculateFees } from "@/lib/payments";
import { z } from "zod";

const createJobSchema = z.object({
  providerId: z.string().optional(),
  category: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  preferredTime: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { platformFee, providerPayout } = calculateFees(data.price);

    let providerProfileId: string | undefined;
    if (data.providerId) {
      const profile = await prisma.providerProfile.findUnique({
        where: { id: data.providerId },
      });
      if (!profile) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }
      providerProfileId = profile.id;
    }

    const job = await prisma.job.create({
      data: {
        seekerId: (session.user as any).id,
        providerId: providerProfileId,
        category: data.category,
        title: data.title,
        description: data.description,
        price: data.price,
        platformFee,
        providerPayout,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        preferredTime: data.preferredTime,
        status: providerProfileId ? "requested" : "open",
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    console.error("Create job error:", err);
    return NextResponse.json({ error: err.message || "Failed to create job" }, { status: 500 });
  }
}
