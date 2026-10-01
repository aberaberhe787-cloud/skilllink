import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security";

/** M-Pesa STK callback → mark payment held */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = body.Body?.stkCallback || body;
    const resultCode = result.ResultCode ?? result.resultCode;
    const checkoutId =
      result.CheckoutRequestID || result.checkoutRequestID || body.externalId || "";
    const meta = result.CallbackMetadata?.Item || [];
    const receipt = Array.isArray(meta)
      ? meta.find((i: { Name?: string }) => i.Name === "MpesaReceiptNumber")?.Value
      : undefined;

    if (resultCode === 0 || resultCode === "0") {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { externalId: String(checkoutId) },
            { externalId: { contains: String(checkoutId) } },
          ],
        },
      });
      if (payment && payment.status === "pending") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "held",
            paidAt: new Date(),
            externalId: receipt ? String(receipt) : payment.externalId,
          },
        });
      }
      await writeAuditLog({
        action: "webhook.mpesa.success",
        resource: "Payment",
        resourceId: payment?.id,
        meta: { checkoutId, receipt },
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("[mpesa webhook]", err);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 });
  }
}
