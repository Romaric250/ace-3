import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MockFocus } from "@prisma/client";

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(300).optional(),
  focus: z.enum(["DATABASE", "C_PROGRAMMING", "MIXED"]).optional(),
  publishedToStudents: z.boolean().optional(),
  markingGuideReleased: z.boolean().optional(),
  questionIds: z.array(z.string()).min(1).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title != null) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.durationMinutes != null) data.durationMinutes = parsed.data.durationMinutes;
  if (parsed.data.focus != null) data.focus = parsed.data.focus as MockFocus;
  if (parsed.data.publishedToStudents != null) data.publishedToStudents = parsed.data.publishedToStudents;
  if (parsed.data.markingGuideReleased != null) data.markingGuideReleased = parsed.data.markingGuideReleased;

  if (parsed.data.questionIds) {
    const uniqueIds = [...new Set(parsed.data.questionIds)];
    const found = await prisma.question.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });
    if (found.length !== uniqueIds.length) {
      return NextResponse.json({ error: "Invalid question id in list." }, { status: 400 });
    }
    await prisma.mockExamQuestion.deleteMany({ where: { mockExamId: id } });
    for (let i = 0; i < uniqueIds.length; i++) {
      await prisma.mockExamQuestion.create({
        data: {
          mockExamId: id,
          questionId: uniqueIds[i],
          orderIndex: i,
        },
      });
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.mockExam.update({ where: { id }, data });
  }

  const mock = await prisma.mockExam.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ mock });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await prisma.mockExam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
