import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const mock = await prisma.mockExam.findFirst({
    where: { id, publishedToStudents: true },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      focus: true,
      markingGuideReleased: true,
      items: {
        orderBy: { orderIndex: "asc" },
        select: { orderIndex: true },
      },
    },
  });

  if (!mock) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inProgress = await prisma.mockAttempt.findFirst({
    where: { mockExamId: id, userId: user.id, submittedAt: null },
    select: { id: true, startedAt: true },
  });

  const lastSubmitted = await prisma.mockAttempt.findFirst({
    where: { mockExamId: id, userId: user.id, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    select: { id: true, submittedAt: true, totalScore: true, maxMarks: true },
  });

  return NextResponse.json({
    mock: {
      id: mock.id,
      title: mock.title,
      description: mock.description,
      durationMinutes: mock.durationMinutes,
      focus: mock.focus,
      markingGuideReleased: mock.markingGuideReleased,
      questionCount: mock.items.length,
      inProgressAttemptId: inProgress?.id ?? null,
      inProgressStartedAt: inProgress?.startedAt ?? null,
      lastAttempt: lastSubmitted,
    },
  });
}
