import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { gradeShortAnswer } from "@/lib/grade-answer";

const bodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answerText: z.string(),
    }),
  ),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string; attemptId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, attemptId } = await ctx.params;

  const attempt = await prisma.mockAttempt.findFirst({
    where: { id: attemptId, mockExamId: id, userId: user.id },
    include: {
      answers: { include: { question: true } },
    },
  });

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.submittedAt) return NextResponse.json({ error: "Already submitted." }, { status: 409 });

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const mock = await prisma.mockExam.findUnique({
    where: { id },
    select: { durationMinutes: true },
  });

  const endsAt = new Date(attempt.startedAt.getTime() + (mock?.durationMinutes ?? 120) * 60_000);
  const timedOut = Date.now() > endsAt.getTime();

  for (const a of parsed.data.answers) {
    await prisma.mockAttemptAnswer.updateMany({
      where: { attemptId, questionId: a.questionId },
      data: { answerText: a.answerText },
    });
  }

  const fresh = await prisma.mockAttempt.findFirstOrThrow({
    where: { id: attemptId },
    include: { answers: { include: { question: true } } },
  });

  let total = 0;
  for (const ans of fresh.answers) {
    const q = ans.question;
    if (!q.modelAnswer) continue;
    try {
      const g = await gradeShortAnswer({
        prompt: q.prompt,
        modelAnswer: q.modelAnswer,
        studentAnswer: ans.answerText,
        maxMarks: q.marks,
      });
      total += g.marksAwarded;
      await prisma.mockAttemptAnswer.updateMany({
        where: { attemptId, questionId: q.id },
        data: {
          aiMarksAwarded: g.marksAwarded,
          aiFeedback: g.feedback,
          gradedAt: new Date(),
        },
      });
    } catch (e) {
      console.error(e);
      await prisma.mockAttemptAnswer.updateMany({
        where: { attemptId, questionId: q.id },
        data: {
          aiMarksAwarded: 0,
          aiFeedback: "Automatic marking unavailable for this item. Your instructor can review manually.",
          gradedAt: new Date(),
        },
      });
    }
  }

  await prisma.mockAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      totalScore: total,
      timedOut,
    },
  });

  return NextResponse.json({
    totalScore: total,
    maxMarks: attempt.maxMarks,
    timedOut,
  });
}
