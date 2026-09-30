import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isWhatsAppConfigured, sendWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    mode: isWhatsAppConfigured() ? "live" : "dev",
    hint: isWhatsAppConfigured()
      ? "WhatsApp Cloud API credentials detected"
      : "Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID for live messages",
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const phone = body.phone || (session.user as any).phone;
    if (!phone) {
      return NextResponse.json(
        { error: "Phone required (E.164 e.g. +2547…)" },
        { status: 400 }
      );
    }

    const result = await sendWhatsApp({
      toPhone: phone,
      event: body.event || "job_requested",
      jobTitle: body.jobTitle || "Test job – printer repair",
      jobId: body.jobId || "test-job-id",
      amountKes: body.amountKes ?? 2500,
      otherPartyName: body.otherPartyName || session.user.name || "SkillLink user",
      extra: body.extra,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
