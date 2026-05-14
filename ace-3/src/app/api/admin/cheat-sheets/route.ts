import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sheets = await prisma.cheatSheet.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      emphasisTopic: true,
      publishedToStudents: true,
      pdfUrl: true,
      pdfFileName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ sheets });
}
