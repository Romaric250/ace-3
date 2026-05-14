import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MockFocus } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(300).default(120),
  focus: z.enum(["DATABASE", "C_PROGRAMMING", "MIXED"]),
  questionIds: z.array(z.string()).min(1),
  publish: z.boolean().default(false),
  markingGuideReleased: z.boolean().default(false),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const mocks = await prisma.mockExam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, attempts: true } },
    },
  });

  return NextResponse.json({ mocks });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { questionIds, title, description, durationMinutes, focus, publish, markingGuideReleased } = parsed.data;

  const uniqueIds = [...new Set(questionIds)];
  const found = await prisma.question.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, marks: true },
  });

  if (found.length !== uniqueIds.length) {
    return NextResponse.json({ error: "One or more question IDs are invalid." }, { status: 400 });
  }

  const maxMarks = found.reduce((s, q) => s + q.marks, 0);

  const mock = await prisma.mockExam.create({
    data: {
      title,
      description,
      durationMinutes,
      focus: focus as MockFocus,
      publishedToStudents: publish,
      markingGuideReleased,
      createdById: admin.id,
      items: {
        create: uniqueIds.map((questionId, orderIndex) => ({
          questionId,
          orderIndex,
        })),
      },
    },
  });

  return NextResponse.json({ mock: { id: mock.id, title: mock.title, maxMarks } });
}
