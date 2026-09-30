/**
 * SkillLink – Security utilities (Round 1 + Round 2)
 */

import { z } from "zod";
import { prisma } from "@/lib/db";

export function sanitizeText(input: unknown, maxLen = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeName(input: unknown): string {
  return sanitizeText(input, 80).replace(/[^\p{L}\p{N}\s.'\-]/gu, "");
}

export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().toLowerCase().slice(0, 254);
}

export function sanitizePhone(input: unknown): string | undefined {
  if (typeof input !== "string" || !input.trim()) return undefined;
  let p = input.replace(/[\s\-()]/g, "");
  if (p.startsWith("0") && p.length >= 9) p = "+254" + p.slice(1);
  if (!p.startsWith("+") && /^\d{9,15}$/.test(p)) p = "+" + p;
  if (!/^\+[1-9]\d{7,14}$/.test(p)) return undefined;
  return p;
}

export function isSafeId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export const jobStatusSchema = z.enum([
  "open", "requested", "accepted", "in_progress", "completed", "cancelled", "disputed",
]);

export const communityPostSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(5).max(4000),
  category: z.enum(["tip", "question", "general"]).optional(),
  neighborhood: z.string().max(60).optional(),
});

export const signupSchemaSecure = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
  role: z.enum(["seeker", "provider"]).default("seeker"),
  phone: z.string().max(20).optional(),
});

export function publicError(err: unknown, fallback = "Something went wrong"): string {
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

export function clientIp(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function jsonError(message: string, status: number, extra?: object) {
  return Response.json({ error: message, ...extra }, { status });
}

const memoryBuckets = new Map<string, { count: number; reset: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || now > entry.reset) {
    memoryBuckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { ok: false, remaining: 0 };
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  return memoryRateLimit(key, limit, windowMs);
}

/** Multi-instance rate limit via Upstash Redis REST when configured */
export async function rateLimitAsync(
  key: string,
  limit = 30,
  windowMs = 60_000
): Promise<{ ok: boolean; remaining: number; backend: "upstash" | "memory" }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { ...memoryRateLimit(key, limit, windowMs), backend: "memory" };
  }
  try {
    const redisKey = `rl:${key}`;
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const incrJson = (await incrRes.json()) as { result?: number };
    const count = Number(incrJson.result ?? 0);
    if (count === 1) {
      const sec = Math.ceil(windowMs / 1000);
      await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${sec}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    if (count > limit) return { ok: false, remaining: 0, backend: "upstash" };
    return { ok: true, remaining: Math.max(0, limit - count), backend: "upstash" };
  } catch (e) {
    console.error("[rateLimit] Upstash failed, memory fallback", e);
    return { ...memoryRateLimit(key, limit, windowMs), backend: "memory" };
  }
}

export async function writeAuditLog(opts: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId || null,
        actorRole: opts.actorRole || null,
        action: opts.action.slice(0, 80),
        resource: opts.resource?.slice(0, 80) || null,
        resourceId: opts.resourceId?.slice(0, 64) || null,
        meta: JSON.stringify(opts.meta || {}).slice(0, 4000),
        ip: opts.ip?.slice(0, 64) || null,
      },
    });
  } catch (e) {
    console.error("[audit] write failed", e);
  }
}

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
]);
export const ALLOWED_DOC_MIME = new Set([
  "application/pdf", "image/jpeg", "image/png",
]);

export function validateUploadMeta(opts: {
  mime: string;
  sizeBytes: number;
  kind?: "image" | "document";
  maxBytes?: number;
}): { ok: true } | { ok: false; error: string } {
  const max = opts.maxBytes ?? 5 * 1024 * 1024;
  if (opts.sizeBytes <= 0 || opts.sizeBytes > max) {
    return { ok: false, error: `File must be under ${Math.round(max / 1024 / 1024)}MB` };
  }
  const set = opts.kind === "document" ? ALLOWED_DOC_MIME : ALLOWED_IMAGE_MIME;
  if (!set.has(opts.mime)) return { ok: false, error: "File type not allowed" };
  return { ok: true };
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
