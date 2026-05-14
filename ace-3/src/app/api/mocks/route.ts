import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mocks = await prisma.mockExam.findMany({
    where: { publishedToStudents: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      focus: true,
      markingGuideReleased: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({
    mocks: mocks.map((m) => ({
      ...m,
      questionCount: m._count.items,
    })),
  });
}
