/**
 * SkillLink Ethiopia – Escrow payments
 * - Job fee: 10% platform commission
 * - Customer bonus: 5% platform commission
 * - Gateways: Telebirr + M-Pesa only
 */

import { prisma } from "@/lib/db";

export const CURRENCY = "ETB";
export const CURRENCY_LABEL = "ETB";
export const PLATFORM_FEE_PERCENT = 10;
export const BONUS_FEE_PERCENT = 5;

export function calculateFees(jobPrice: number) {
  const platformFee = Math.round(jobPrice * (PLATFORM_FEE_PERCENT / 100));
  const providerPayout = jobPrice - platformFee;
  return { platformFee, providerPayout };
}

export function calculateBonusFees(bonusAmount: number) {
  const platformFeeKes = Math.round(bonusAmount * (BONUS_FEE_PERCENT / 100));
  const providerAmount = bonusAmount - platformFeeKes;
  return { platformFeeKes, providerAmount };
}

export const DEFAULT_CATEGORY_CAPS: Record<string, { maxKes: number; minKes: number }> = {
  "Printer Repair & Maintenance": { maxKes: 3500, minKes: 200 },
  "CCTV & Security Systems": { maxKes: 12000, minKes: 800 },
  "TV & Home Electronics": { maxKes: 5000, minKes: 300 },
  "Computer & Laptop Repair": { maxKes: 6000, minKes: 300 },
  "Phone & Tablet Repair": { maxKes: 4000, minKes: 200 },
  "Networking & Wi‑Fi": { maxKes: 5000, minKes: 300 },
  "Electrical (light appliances)": { maxKes: 4000, minKes: 200 },
  "Solar & Inverter (basic)": { maxKes: 10000, minKes: 800 },
  "Other technical help": { maxKes: 6000, minKes: 200 },
};

export async function getCategoryCap(category: string): Promise<{ maxKes: number; minKes: number }> {
  try {
    const row = await prisma.categoryPriceCap.findUnique({ where: { category } });
    if (row) return { maxKes: row.maxKes, minKes: row.minKes };
  } catch {
    /* table may not exist */
  }
  return DEFAULT_CATEGORY_CAPS[category] || { maxKes: 6000, minKes: 200 };
}

export type PaymentProvider = "telebirr" | "mpesa";

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
  instructions?: string;
  error?: string;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const { platformFee, providerPayout } = calculateFees(input.amount);
  const gateway: PaymentProvider =
    input.provider === "mpesa" ? "mpesa" : "telebirr";

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

    const externalId =
      gateway === "telebirr"
        ? `TELEBIRR_${payment.id}`
        : `MPESA_ET_${payment.id}`;

    const instructions =
      gateway === "telebirr"
        ? `Telebirr: confirm the push on ${input.customerPhone || "your phone"} (demo id ${externalId}). Set TELEBIRR_APP_ID / TELEBIRR_APP_KEY for live.`
        : `M-Pesa Ethiopia: enter PIN on the STK prompt (demo id ${externalId}). Set MPESA_CONSUMER_KEY / MPESA_PASSKEY for live.`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId, checkoutUrl: null },
    });

    if (gateway === "telebirr" && process.env.TELEBIRR_APP_ID && process.env.TELEBIRR_APP_KEY) {
      console.log("[telebirr] live credentials detected – wire order API here", externalId);
    }
    if (gateway === "mpesa" && process.env.MPESA_CONSUMER_KEY && process.env.MPESA_PASSKEY) {
      console.log("[mpesa-et] live credentials detected – wire STK push here", externalId);
    }

    return {
      success: true,
      paymentId: payment.id,
      externalId,
      instructions,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment create failed";
    return { success: false, error: message };
  }
}

export async function markPaymentHeld(paymentId: string) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: "held", paidAt: new Date() },
  });
}

export async function releasePaymentToWallet(jobId: string) {
  const payment = await prisma.payment.findUnique({ where: { jobId } });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "released") return payment;
  if (payment.status !== "held" && payment.status !== "pending") {
    throw new Error(`Cannot release payment in status ${payment.status}`);
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { provider: true },
  });
  if (!job?.provider?.userId) throw new Error("No provider on job");

  const amount = payment.providerAmount;

  let wallet = await prisma.wallet.findUnique({
    where: { userId: job.provider.userId },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: job.provider.userId, balanceKes: 0 },
    });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "released", releasedAt: new Date() },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceKes: { increment: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "job_payout",
        amountKes: amount,
        description: `Job payout (90% of fee) – ${job.title}`,
        jobId,
      },
    }),
  ]);

  return prisma.payment.findUnique({ where: { id: payment.id } });
}
