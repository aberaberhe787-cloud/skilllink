import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeEmail, sanitizeName } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = sanitizeEmail(body?.email);
    const name = sanitizeName(body?.name);
    const photoUrl = typeof body?.photoUrl === "string" ? body.photoUrl : null;
    const requestedRole = body?.role === "provider" ? "provider" : "seeker";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: photoUrl,
          role: requestedRole,
        },
      });

      if (requestedRole === "provider") {
        await prisma.providerProfile.create({
          data: {
            userId: user.id,
            verificationStatus: "pending",
            isVerified: false,
          },
        }).catch(() => {
          // Ignore if already created
        });
      }
    } else {
      // Update image or name if missing
      const shouldUpdateImage = photoUrl && !user.image;
      const shouldUpdateName = name && !user.name;

      if (shouldUpdateImage || shouldUpdateName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(shouldUpdateImage ? { image: photoUrl } : {}),
            ...(shouldUpdateName ? { name } : {}),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error: unknown) {
    console.error("Firebase sync error:", error);
    return NextResponse.json(
      { error: "Authentication sync failed" },
      { status: 500 }
    );
  }
}
