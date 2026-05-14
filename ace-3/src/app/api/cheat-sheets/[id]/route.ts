import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const sheet = await prisma.cheatSheet.findUnique({ where: { id } });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canRead = sheet.publishedToStudents || user.role === "ADMIN";
  if (!canRead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ sheet });
}
