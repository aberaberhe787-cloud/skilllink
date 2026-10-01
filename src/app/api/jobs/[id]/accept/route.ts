import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { createPayment, calculateFees } from "@/lib/payments";
import { isSafeId, publicError, rateLimit, clientIp } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  paymentMethod: z.enum(["telebirr", "mpesa"]).default("telebirr"),
  phone: z.string().min(9).max(20).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isSafeId(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  const userId = (session.user as { id: string }).id;
  if (!rateLimit(`accept:${userId}:${clientIp(req)}`, 15, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const job = await prisma.job.findUnique({ where: { id }, include: { payment: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.seekerId !== userId && (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Only the customer can accept" }, { status: 403 });
    }
    const price = job.quotedPrice ?? job.price;
    if (!price || price <= 0) return NextResponse.json({ error: "No quote to accept yet" }, { status: 400 });
    if (!job.providerId) return NextResponse.json({ error: "No technician on this job" }, { status: 400 });
    const { platformFee, providerPayout } = calculateFees(price);
    await prisma.job.update({
      where: { id },
      data: { price, platformFee, providerPayout, status: "accepted" },
    });
    const paymentResult = await createPayment({
      jobId: id,
      amount: price,
      customerEmail: session.user.email || "",
      customerName: session.user.name || "Customer",
      customerPhone: parsed.data.phone,
      redirectUrl: `${process.env.AUTH_URL || ""}/jobs/${id}`,
      provider: parsed.data.paymentMethod,
    });
    if (!paymentResult.success) return NextResponse.json({ error: paymentResult.error }, { status: 500 });
    return NextResponse.json({
      success: true,
      jobId: id,
      status: "accepted",
      price,
      currency: "ETB",
      payment: paymentResult,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: publicError(err, "Accept failed") }, { status: 500 });
  }
}
