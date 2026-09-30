/**
 * Payment / Escrow skeleton for SkillLink
 * Platform takes 10% commission.
 */

import { prisma } from "@/lib/db";

export const PLATFORM_FEE_PERCENT = 10;

export function calculateFees(jobPrice: number) {
  const platformFee = Math.round(jobPrice * (PLATFORM_FEE_PERCENT / 100));
  const providerPayout = jobPrice - platformFee;
  return { platformFee, providerPayout };
}

export type PaymentProvider = "flutterwave" | "stripe" | "mpesa" | "cash";

export interface CreatePaymentInput {
  jobId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
  provider?: PaymentProvider;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  externalId?: string;
  error?: string;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const { platformFee, providerPayout } = calculateFees(input.amount);
  const gateway = input.provider || "flutterwave";

  try {
    const payment = await prisma.payment.create({
      data: {
        jobId: input.jobId,
        amount: input.amount,
        platformFee,
        providerAmount: providerPayout,
        status: "pending",
        provider: gateway,
      },
    });

    let checkoutUrl: string | undefined;
    let externalId: string | undefined;

    if (gateway === "flutterwave") {
      externalId = `FLW_DEMO_${payment.id}`;
      checkoutUrl = `https://checkout.flutterwave.com/v3/hosted/pay/${externalId}`;
    } else if (gateway === "stripe") {
      externalId = `STRIPE_DEMO_${payment.id}`;
      checkoutUrl = `https://checkout.stripe.com/pay/${externalId}`;
    } else if (gateway === "mpesa") {
      externalId = `MPESA_DEMO_${payment.id}`;
    } else if (gateway === "cash") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "held" },
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId, checkoutUrl },
    });

    return {
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      externalId,
    };
  } catch (err: any) {
    console.error("createPayment error:", err);
    return { success: false, error: err.message || "Payment creation failed" };
  }
}

export async function confirmPaymentHeld(externalId: string) {
  const payment = await prisma.payment.findFirst({ where: { externalId } });
  if (!payment) throw new Error("Payment not found");

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "held", paidAt: new Date() },
  });

  return payment;
}

export async function releasePaymentToProvider(jobId: string) {
  const payment = await prisma.payment.findUnique({
    where: { jobId },
    include: { job: true },
  });

  if (!payment) throw new Error("Payment not found for job");
  if (payment.status !== "held") {
    throw new Error(`Cannot release payment in status: ${payment.status}`);
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "released", releasedAt: new Date() },
  });

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "completed", completedAt: new Date() },
  });

  return payment;
}

export async function refundPayment(jobId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { jobId } });
  if (!payment) throw new Error("Payment not found");
  if (!["pending", "held"].includes(payment.status)) {
    throw new Error(`Cannot refund payment in status: ${payment.status}`);
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "refunded" },
  });

  return payment;
}
