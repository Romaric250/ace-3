import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { gradeShortAnswer } from "@/lib/grade-answer";

const bodySchema = z.object({
  answer: z.string().max(50_000),
});

/** Submit a practice answer: AI mark + reveal model answer (published questions only). */
export async function POST(req: Request, ctx: { params: Promise<{ questionId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const q = await prisma.question.findFirst({
    where: { id: questionId, publishedToStudents: true },
    select: {
      id: true,
      prompt: true,
      marks: true,
      modelAnswer: true,
      explanation: true,
    },
  });

  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const modelAnswer = q.modelAnswer?.trim();
  if (!modelAnswer) {
    return NextResponse.json(
      { error: "This question cannot be auto-marked yet (no model answer on file)." },
      { status: 422 },
    );
  }

  try {
    const { marksAwarded, feedback } = await gradeShortAnswer({
      prompt: q.prompt,
      modelAnswer,
      studentAnswer: parsed.data.answer,
      maxMarks: q.marks,
    });

    return NextResponse.json({
      marksAwarded,
      maxMarks: q.marks,
      feedback,
      modelAnswer,
      explanation: q.explanation?.trim() || null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Marking failed. Try again." }, { status: 502 });
  }
}
