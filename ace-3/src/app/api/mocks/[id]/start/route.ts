import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const mock = await prisma.mockExam.findFirst({
    where: { id, publishedToStudents: true },
    include: { items: true },
  });

  if (!mock || mock.items.length === 0) {
    return NextResponse.json({ error: "Mock not available." }, { status: 404 });
  }

  const existing = await prisma.mockAttempt.findFirst({
    where: { mockExamId: id, userId: user.id, submittedAt: null },
  });

  if (existing) {
    return NextResponse.json({
      attemptId: existing.id,
      startedAt: existing.startedAt.toISOString(),
      resumed: true,
    });
  }

  const maxMarks = await prisma.question.aggregate({
    where: { id: { in: mock.items.map((i) => i.questionId) } },
    _sum: { marks: true },
  });

  const attempt = await prisma.mockAttempt.create({
    data: {
      mockExamId: id,
      userId: user.id,
      maxMarks: maxMarks._sum.marks ?? 0,
      answers: {
        create: mock.items.map((item) => ({
          questionId: item.questionId,
          answerText: "",
        })),
      },
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    startedAt: attempt.startedAt.toISOString(),
    resumed: false,
  });
}
