import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  signupSchemaSecure,
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  rateLimit,
  clientIp,
  publicError,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`signup:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = signupSchemaSecure.safeParse({
      ...body,
      name: sanitizeName(body?.name),
      email: sanitizeEmail(body?.email),
      phone: body?.phone,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const phone = sanitizePhone(parsed.data.phone);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, hashedPassword, role, phone },
    });

    if (role === "provider") {
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          verificationStatus: "pending",
          isVerified: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: publicError(err, "Signup failed") }, { status: 500 });
  }
}
