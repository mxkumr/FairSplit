import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ groupId: string; expenseId: string }> };

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, expenseId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId },
    });

    if (!expense) {
      return jsonError("Expense not found", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("File type not allowed", 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonError("File too large (max 5MB)", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".bin";
    const filename = `${expenseId}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "expenses");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/expenses/${filename}`;
    const document = await prisma.expenseDocument.create({
      data: {
        expenseId,
        filename: file.name,
        mimeType: file.type,
        url,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
