import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security";

/** Telebirr notify URL → mark payment held on success */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const externalId =
      body.merch_order_id || body.outTradeNo || body.externalId || body.OUTTRADENO || "";
    const status = String(body.trade_status || body.status || body.STATUS || "").toLowerCase();

    if (!externalId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: String(externalId) },
          { id: String(externalId).replace(/^TELEBIRR_/, "") },
        ],
      },
    });

    if (!payment) {
      await writeAuditLog({
        action: "webhook.telebirr.unknown",
        resource: "Payment",
        resourceId: String(externalId),
        meta: { status },
      });
      return NextResponse.json({ ok: true, matched: false });
    }

    const success =
      status.includes("success") ||
      status === "0" ||
      status === "completed" ||
      status === "paid" ||
      body.resultCode === "0";

    if (success && payment.status === "pending") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "held", paidAt: new Date() },
      });
    }

    await writeAuditLog({
      action: "webhook.telebirr.accepted",
      resource: "Payment",
      resourceId: payment.id,
      meta: { status, externalId: String(externalId), success },
    });

    return NextResponse.json({ ok: true, matched: true, paymentId: payment.id });
  } catch (err) {
    console.error("[telebirr webhook]", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
