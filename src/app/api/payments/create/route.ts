import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createPayment, calculateFees, markPaymentHeld } from "@/lib/payments";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  jobId: z.string(),
  amount: z.number().positive().max(5_000_000),
  provider: z.enum(["telebirr", "mpesa"]).default("telebirr"),
  phone: z.string().optional(),
  simulateSuccess: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { jobId, amount, provider, phone, simulateSuccess } = parsed.data;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const userId = (session.user as { id?: string }).id;
    if (job.seekerId !== userId && (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { platformFee, providerPayout } = calculateFees(amount);
    await prisma.job.update({
      where: { id: jobId },
      data: { price: amount, platformFee, providerPayout },
    });
    const result = await createPayment({
      jobId,
      amount,
      customerEmail: session.user.email || "",
      customerName: session.user.name || "Customer",
      customerPhone: phone,
      redirectUrl: `${process.env.AUTH_URL || ""}/jobs/${jobId}`,
      provider,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    if (simulateSuccess && result.paymentId) await markPaymentHeld(result.paymentId);
    return NextResponse.json({
      paymentId: result.paymentId,
      externalId: result.externalId,
      instructions: result.instructions,
      currency: "ETB",
      fees: { platformFee, providerPayout },
      status: simulateSuccess ? "held" : "pending",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
