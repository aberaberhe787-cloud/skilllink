/**
 * Telebirr H5 / web checkout (Ethiopia sandbox + production)
 */

import crypto from "crypto";

export function isTelebirrConfigured(): boolean {
  return Boolean(
    process.env.TELEBIRR_APP_ID &&
      process.env.TELEBIRR_APP_KEY &&
      process.env.TELEBIRR_SHORT_CODE
  );
}

function baseUrl(): string {
  if (process.env.TELEBIRR_BASE_URL) return process.env.TELEBIRR_BASE_URL;
  const env = (process.env.TELEBIRR_ENV || "sandbox").toLowerCase();
  if (env === "production" || env === "prod") {
    return (
      process.env.TELEBIRR_PROD_URL ||
      "https://superapp.ethiomobilemoney.et:38443/apiaccess/payment/gateway"
    );
  }
  return "https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway";
}

function webPayBase(): string {
  const env = (process.env.TELEBIRR_ENV || "sandbox").toLowerCase();
  if (env === "production" || env === "prod") {
    return "https://superapp.ethiomobilemoney.et:38443/payment/web/paygate";
  }
  return "https://developerportal.ethiotelebirr.et:38443/payment/web/paygate";
}

function nonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function signAndEncryptPayload(
  params: Record<string, string>,
  publicKeyPem: string
): { sign: string; ussd: string } {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const sign = crypto.createHash("sha256").update(sorted).digest("hex");

  let key = publicKeyPem.trim();
  if (!key.includes("BEGIN")) {
    key = `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
  }
  const encrypted = crypto.publicEncrypt(
    { key, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(JSON.stringify(params))
  );
  return { sign, ussd: encrypted.toString("base64") };
}

export interface TelebirrOrderInput {
  outTradeNo: string;
  subject: string;
  totalAmount: string;
  returnUrl: string;
  notifyUrl?: string;
  receiveName?: string;
  timeoutExpress?: string;
}

export interface TelebirrOrderResult {
  ok: boolean;
  mode: "live" | "sandbox" | "demo";
  toPayUrl?: string;
  prepayId?: string;
  receiveCode?: string;
  merchOrderId?: string;
  raw?: unknown;
  error?: string;
}

export async function createTelebirrOrder(
  input: TelebirrOrderInput
): Promise<TelebirrOrderResult> {
  if (!isTelebirrConfigured()) {
    return { ok: false, mode: "demo", error: "Telebirr credentials not set" };
  }

  const appId = process.env.TELEBIRR_APP_ID!;
  const appKey = process.env.TELEBIRR_APP_KEY!;
  const shortCode = process.env.TELEBIRR_SHORT_CODE!;
  const publicKey = process.env.TELEBIRR_PUBLIC_KEY || "";
  const notifyUrl =
    input.notifyUrl ||
    process.env.TELEBIRR_NOTIFY_URL ||
    `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || ""}/api/webhooks/telebirr`;
  const receiveName =
    input.receiveName || process.env.TELEBIRR_RECEIVE_NAME || "SkillLink";
  const timeoutExpress = input.timeoutExpress || "30";
  const timestamp = String(Date.now());
  const n = nonce();
  const mode =
    (process.env.TELEBIRR_ENV || "sandbox").toLowerCase() === "production"
      ? "live"
      : "sandbox";

  if (publicKey) {
    try {
      const params: Record<string, string> = {
        appId,
        appKey,
        nonce: n,
        notifyUrl,
        outTradeNo: input.outTradeNo,
        receiveName,
        returnUrl: input.returnUrl,
        shortCode,
        subject: input.subject.slice(0, 128),
        timeoutExpress,
        timestamp,
        totalAmount: input.totalAmount,
      };
      const { ussd, sign } = signAndEncryptPayload(params, publicKey);
      const url = `${baseUrl()}/payment/v1/merchant/preOrder`;
      const payUrl = `${webPayBase()}?appid=${encodeURIComponent(appId)}&ussd=${encodeURIComponent(ussd)}&sign=${encodeURIComponent(sign)}&sourceType=H5`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, sign, ussd }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        const toPayUrl =
          data?.data?.toPayUrl || data?.toPayUrl || data?.data?.payUrl || payUrl;
        return {
          ok: true,
          mode,
          toPayUrl,
          prepayId: data?.data?.prepayId || data?.prepayId,
          merchOrderId: input.outTradeNo,
          raw: data,
        };
      }

      return { ok: true, mode, toPayUrl: payUrl, merchOrderId: input.outTradeNo };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Telebirr H5 failed";
      console.error("[telebirr]", message);
      return { ok: false, mode, error: message };
    }
  }

  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const privateKey = process.env.TELEBIRR_PRIVATE_KEY;
  if (fabricAppId && privateKey) {
    try {
      const tokenRes = await fetch(`${baseUrl()}/payment/v1/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": fabricAppId,
        },
        body: JSON.stringify({ appSecret: appKey }),
      });
      const tokenJson = await tokenRes.json().catch(() => ({}));
      const token =
        tokenJson?.token || tokenJson?.data?.token || tokenJson?.access_token;
      if (!token) {
        return {
          ok: false,
          mode,
          error: "Fabric token failed",
          raw: tokenJson,
        };
      }

      const createRes = await fetch(`${baseUrl()}/payment/v1/merchant/preOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-APP-Key": fabricAppId,
        },
        body: JSON.stringify({
          title: input.subject.slice(0, 128),
          totalAmount: input.totalAmount,
          merchOrderId: input.outTradeNo,
          notifyUrl,
          returnUrl: input.returnUrl,
          shortCode,
        }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      const toPayUrl =
        createJson?.data?.toPayUrl ||
        createJson?.toPayUrl ||
        createJson?.data?.paymentUrl;
      const receiveCode =
        createJson?.data?.receiveCode || createJson?.receiveCode;

      if (!createRes.ok && !toPayUrl && !receiveCode) {
        return {
          ok: false,
          mode,
          error: createJson?.message || "preOrder failed",
          raw: createJson,
        };
      }

      return {
        ok: true,
        mode,
        toPayUrl,
        receiveCode,
        prepayId: createJson?.data?.prepayId,
        merchOrderId: input.outTradeNo,
        raw: createJson,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fabric order failed";
      console.error("[telebirr fabric]", message);
      return { ok: false, mode, error: message };
    }
  }

  return {
    ok: false,
    mode: "demo",
    error:
      "Set TELEBIRR_PUBLIC_KEY (H5) or TELEBIRR_FABRIC_APP_ID + TELEBIRR_PRIVATE_KEY",
  };
}
