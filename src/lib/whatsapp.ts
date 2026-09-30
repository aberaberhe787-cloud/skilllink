/**
 * WhatsApp job notifications via Meta Cloud API (WhatsApp Business).
 * Without credentials, messages are logged (dev mode).
 */

export type WhatsAppEvent =
  | "job_requested"
  | "job_accepted"
  | "job_in_progress"
  | "job_completed"
  | "payment_held"
  | "payment_released"
  | "dispute_opened";

export interface NotifyPayload {
  toPhone: string;
  event: WhatsAppEvent;
  jobTitle: string;
  jobId: string;
  amountKes?: number;
  otherPartyName?: string;
  extra?: string;
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, "");
  if (p.startsWith("0") && p.length >= 9) p = "+254" + p.slice(1);
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

function buildMessage(payload: NotifyPayload): string {
  const name = payload.otherPartyName || "someone";
  const money =
    payload.amountKes != null ? `KES ${payload.amountKes.toLocaleString()}` : "";

  const lines: Record<WhatsAppEvent, string> = {
    job_requested: `🔧 *SkillLink*\nNew job request: *${payload.jobTitle}*\nFrom: ${name}${money ? `\nOffer: ${money}` : ""}\nOpen the app to accept or decline.\nJob ID: ${payload.jobId}`,
    job_accepted: `✅ *SkillLink*\nYour job *${payload.jobTitle}* was accepted by ${name}.\nThey will contact you to schedule.\nJob ID: ${payload.jobId}`,
    job_in_progress: `🛠️ *SkillLink*\nJob *${payload.jobTitle}* is now in progress.\nJob ID: ${payload.jobId}`,
    job_completed: `🎉 *SkillLink*\nJob *${payload.jobTitle}* marked complete.\nPlease confirm in the app to release payment${money ? ` (${money})` : ""}.\nJob ID: ${payload.jobId}`,
    payment_held: `💳 *SkillLink*\nPayment held in escrow for *${payload.jobTitle}*${money ? `: ${money}` : ""}.\nFunds release when the customer confirms.\nJob ID: ${payload.jobId}`,
    payment_released: `💰 *SkillLink*\nPayout released for *${payload.jobTitle}*${money ? `: ${money}` : ""}.\nCheck your SkillLink wallet.\nJob ID: ${payload.jobId}`,
    dispute_opened: `⚠️ *SkillLink*\nA dispute was opened on *${payload.jobTitle}*.\n${payload.extra || "Please respond in the dispute centre."}\nJob ID: ${payload.jobId}`,
  };

  return lines[payload.event] || `SkillLink update for job ${payload.jobId}`;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsApp(payload: NotifyPayload): Promise<{
  ok: boolean;
  mode: "live" | "dev";
  id?: string;
  error?: string;
}> {
  const phone = normalizePhone(payload.toPhone);
  const text = buildMessage(payload);

  if (!isWhatsAppConfigured()) {
    console.log("[whatsapp:dev]", phone, payload.event, text.slice(0, 120) + "…");
    return { ok: true, mode: "dev" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_TOKEN!;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace("+", ""),
          type: "text",
          text: { preview_url: false, body: text },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("[whatsapp] API error", data);
      return { ok: false, mode: "live", error: data?.error?.message || "WhatsApp API error" };
    }

    return { ok: true, mode: "live", id: data?.messages?.[0]?.id };
  } catch (err: any) {
    console.error("[whatsapp] send failed", err);
    return { ok: false, mode: "live", error: err.message || "Network error" };
  }
}

export async function notifyJobParties(opts: {
  event: WhatsAppEvent;
  jobId: string;
  jobTitle: string;
  amountKes?: number;
  seekerPhone?: string | null;
  providerPhone?: string | null;
  seekerName?: string | null;
  providerName?: string | null;
  extra?: string;
}) {
  const results = [];

  if (opts.providerPhone && ["job_requested", "payment_held", "dispute_opened"].includes(opts.event)) {
    results.push(
      await sendWhatsApp({
        toPhone: opts.providerPhone,
        event: opts.event,
        jobTitle: opts.jobTitle,
        jobId: opts.jobId,
        amountKes: opts.amountKes,
        otherPartyName: opts.seekerName || undefined,
        extra: opts.extra,
      })
    );
  }

  if (
    opts.seekerPhone &&
    ["job_accepted", "job_in_progress", "job_completed", "payment_released", "dispute_opened"].includes(opts.event)
  ) {
    results.push(
      await sendWhatsApp({
        toPhone: opts.seekerPhone,
        event: opts.event,
        jobTitle: opts.jobTitle,
        jobId: opts.jobId,
        amountKes: opts.amountKes,
        otherPartyName: opts.providerName || undefined,
        extra: opts.extra,
      })
    );
  }

  if (opts.seekerPhone && opts.event === "payment_held") {
    results.push(
      await sendWhatsApp({
        toPhone: opts.seekerPhone,
        event: "payment_held",
        jobTitle: opts.jobTitle,
        jobId: opts.jobId,
        amountKes: opts.amountKes,
      })
    );
  }

  return results;
}
