import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { calculateFees } from "@/lib/payments";
import { notifyJobParties } from "@/lib/whatsapp";
import { sanitizeText, rateLimit, clientIp, publicError } from "@/lib/security";
import { z } from "zod";

const createJobSchema = z.object({
  providerId: z.string().optional(),
  category: z.string().min(1).max(120),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  price: z.number().positive().max(5_000_000),
  address: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  preferredTime: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
  }

  const rl = rateLimit(`job:${(session.user as { id?: string }).id}:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many job requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    if (body.title) body.title = sanitizeText(body.title, 120);
    if (body.description) body.description = sanitizeText(body.description, 4000);
    if (body.address) body.address = sanitizeText(body.address, 200);
    if (body.preferredTime) body.preferredTime = sanitizeText(body.preferredTime, 80);

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
        seekerId: (session.user as { id: string }).id,
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

    if (providerProfileId) {
      try {
        const profile = await prisma.providerProfile.findUnique({
          where: { id: providerProfileId },
          include: { user: true },
        });
        const seeker = await prisma.user.findUnique({
          where: { id: (session.user as { id: string }).id },
        });
        if (profile?.user?.phone) {
          await notifyJobParties({
            event: "job_requested",
            jobId: job.id,
            jobTitle: job.title,
            amountKes: job.price,
            providerPhone: profile.user.phone,
            seekerName: seeker?.name || session.user.name,
            seekerPhone: seeker?.phone,
          });
        }
      } catch (notifyErr) {
        console.error("WhatsApp notify failed (non-blocking):", notifyErr);
      }
    }

    return NextResponse.json({ success: true, job });
  } catch (err: unknown) {
    console.error("Create job error:", err);
    return NextResponse.json(
      { error: publicError(err, "Failed to create job") },
      { status: 500 }
    );
  }
}
