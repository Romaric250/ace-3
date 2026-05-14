import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** Student-facing list: only guides admins have published. */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheets = await prisma.cheatSheet.findMany({
    where: { publishedToStudents: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      emphasisTopic: true,
      pdfUrl: true,
      pdfFileName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ sheets });
}
