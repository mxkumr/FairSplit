import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    if (!q || q.length < 2) {
      return jsonError("Search query must be at least 2 characters", 400);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.userId },
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
