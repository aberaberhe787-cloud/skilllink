/**
 * SkillLink – Round 1 security utilities
 */

import { z } from "zod";

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
  "open",
  "requested",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
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
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["seeker", "provider"]).default("seeker"),
  phone: z.string().max(20).optional(),
});

export function publicError(err: unknown, fallback = "Something went wrong"): string {
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
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
