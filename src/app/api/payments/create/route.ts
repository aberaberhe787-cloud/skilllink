import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createPayment, calculateFees } from "@/lib/payments";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  jobId: z.string().min(1),
  amount: z.number().positive(),
  provider: z.enum(["flutterwave", "stripe", "mpesa", "cash"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error }, { status: 400 });
    }

    const { jobId, amount, provider } = parsed.data;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
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
      redirectUrl: `${process.env.NEXTAUTH_URL}/jobs/${jobId}/payment-success`,
      provider: provider || "flutterwave",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      paymentId: result.paymentId,
      checkoutUrl: result.checkoutUrl,
      externalId: result.externalId,
      fees: { platformFee, providerPayout },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
