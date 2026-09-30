/**
 * Payment / Escrow for SkillLink
 * - Job fee: 10% platform commission
 * - Customer bonus/tip: 5% platform commission
 */

import { prisma } from "@/lib/db";

export const PLATFORM_FEE_PERCENT = 10;
export const BONUS_FEE_PERCENT = 5;

export function calculateFees(jobPrice: number) {
  const platformFee = Math.round(jobPrice * (PLATFORM_FEE_PERCENT / 100));
  const providerPayout = jobPrice - platformFee;
  return { platformFee, providerPayout };
}

export function calculateBonusFees(bonusKes: number) {
  const platformFeeKes = Math.round(bonusKes * (BONUS_FEE_PERCENT / 100));
  const providerAmount = bonusKes - platformFeeKes;
  return { platformFeeKes, providerAmount };
}

export const DEFAULT_CATEGORY_CAPS: Record<string, { maxKes: number; minKes: number }> = {
  "Printer Repair & Maintenance": { maxKes: 8000, minKes: 500 },
  "CCTV & Security Systems": { maxKes: 25000, minKes: 1500 },
  "TV & Home Electronics": { maxKes: 12000, minKes: 800 },
  "Computer & Laptop Repair": { maxKes: 15000, minKes: 800 },
  "Phone & Tablet Repair": { maxKes: 10000, minKes: 500 },
  "Networking & Wi‑Fi": { maxKes: 12000, minKes: 800 },
  "Electrical (light appliances)": { maxKes: 10000, minKes: 500 },
  "Solar & Inverter (basic)": { maxKes: 20000, minKes: 1500 },
  "Other technical help": { maxKes: 15000, minKes: 500 },
};

export async function getCategoryCap(category: string): Promise<{ maxKes: number; minKes: number }> {
  try {
    const row = await prisma.categoryPriceCap.findUnique({ where: { category } });
    if (row) return { maxKes: row.maxKes, minKes: row.minKes };
  } catch {
    /* table may not exist */
  }
  return DEFAULT_CATEGORY_CAPS[category] || { maxKes: 15000, minKes: 500 };
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

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
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
    } else {
      externalId = `CASH_${payment.id}`;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId, checkoutUrl: checkoutUrl || null },
    });

    return { success: true, paymentId: payment.id, checkoutUrl, externalId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment create failed";
    return { success: false, error: message };
  }
}
