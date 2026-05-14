import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answerText: z.string(),
    }),
  ),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; attemptId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, attemptId } = await ctx.params;

  const attempt = await prisma.mockAttempt.findFirst({
    where: { id: attemptId, mockExamId: id, userId: user.id },
  });

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.submittedAt) return NextResponse.json({ error: "Already submitted." }, { status: 409 });

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await Promise.all(
    parsed.data.answers.map((a) =>
      prisma.mockAttemptAnswer.updateMany({
        where: { attemptId, questionId: a.questionId },
        data: { answerText: a.answerText },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; attemptId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, attemptId } = await ctx.params;

  const attempt = await prisma.mockAttempt.findFirst({
    where: { id: attemptId, mockExamId: id, userId: user.id },
    include: {
      mockExam: {
        select: {
          title: true,
          durationMinutes: true,
          markingGuideReleased: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orderRows = await prisma.mockExamQuestion.findMany({
    where: { mockExamId: id },
    select: { questionId: true, orderIndex: true },
  });
  const orderMap = new Map(orderRows.map((r) => [r.questionId, r.orderIndex]));

  const answersSorted = attempt.answers
    .slice()
    .sort((a, b) => (orderMap.get(a.questionId) ?? 0) - (orderMap.get(b.questionId) ?? 0));

  const submitted = Boolean(attempt.submittedAt);
  const release = attempt.mockExam.markingGuideReleased;

  const endsAt = new Date(
    attempt.startedAt.getTime() + attempt.mockExam.durationMinutes * 60_000,
  ).toISOString();

  const questions = answersSorted.map((a) => {
    const q = a.question;
    const base = {
      id: q.id,
      topic: q.topic,
      type: q.type,
      prompt: q.prompt,
      marks: q.marks,
    };

    if (!submitted) {
      return {
        ...base,
        answerText: a.answerText,
        modelAnswer: null as string | null,
        explanation: null as string | null,
      };
    }

    return {
      ...base,
      answerText: a.answerText,
      aiMarksAwarded: a.aiMarksAwarded,
      aiFeedback: a.aiFeedback,
      modelAnswer: release ? q.modelAnswer : null,
      explanation: release ? q.explanation : null,
    };
  });

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      submitted,
      endsAt,
      durationMinutes: attempt.mockExam.durationMinutes,
      title: attempt.mockExam.title,
      markingGuideReleased: release,
      totalScore: attempt.totalScore,
      maxMarks: attempt.maxMarks,
      timedOut: attempt.timedOut,
      questions,
    },
  });
}
