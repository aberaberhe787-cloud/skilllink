import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORY_CAPS } from "@/lib/payments";

export async function GET() {
  try {
    const rows = await prisma.categoryPriceCap.findMany();
    const map: Record<string, { maxKes: number; minKes: number }> = {
      ...DEFAULT_CATEGORY_CAPS,
    };
    for (const r of rows) {
      map[r.category] = { maxKes: r.maxKes, minKes: r.minKes };
    }
    return NextResponse.json(map);
  } catch {
    return NextResponse.json(DEFAULT_CATEGORY_CAPS);
  }
}
