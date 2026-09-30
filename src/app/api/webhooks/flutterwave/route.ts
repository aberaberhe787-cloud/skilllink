import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hmacSha256Hex, timingSafeEqual, writeAuditLog, publicError } from "@/lib/security";

export async function POST(req: NextRequest) {
  const secretHash = process.env.FLW_SECRET_HASH || process.env.FLW_SECRET_KEY;

  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("verif-hash") || req.headers.get("Verif-Hash") || "";

    if (!secretHash) {
      console.error("[webhook/flutterwave] FLW_SECRET_HASH not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const hmac = await hmacSha256Hex(secretHash, rawBody);
    const valid =
      timingSafeEqual(signature, secretHash) ||
      timingSafeEqual(signature.toLowerCase(), hmac);

    if (!signature || !valid) {
      await writeAuditLog({
        action: "webhook.flutterwave.rejected",
        resource: "Payment",
        meta: { reason: "invalid_signature" },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: {
      event?: string;
      data?: { id?: number | string; tx_ref?: string; status?: string; amount?: number };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const txRef = payload.data?.tx_ref;
    const status = payload.data?.status;
    const externalId = payload.data?.id != null ? String(payload.data.id) : undefined;

    if (txRef && status === "successful") {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [{ externalId: txRef }, { externalId: externalId || "" }, { id: txRef }],
        },
      });

      if (payment && payment.status !== "held" && payment.status !== "released") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "held",
            paidAt: new Date(),
            externalId: externalId || payment.externalId,
          },
        });
      }
    }

    await writeAuditLog({
      action: "webhook.flutterwave.accepted",
      resource: "Payment",
      resourceId: txRef,
      meta: { event: payload.event, status },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[webhook/flutterwave]", err);
    return NextResponse.json({ error: publicError(err, "Webhook failed") }, { status: 500 });
  }
}
