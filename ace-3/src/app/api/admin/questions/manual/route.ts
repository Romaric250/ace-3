import { NextResponse } from "next/server";
import { z } from "zod";
import { Topic } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  topic: z.enum(["DATABASE", "C_PROGRAMMING", "MIXED"]),
  type: z.string().max(40).default("short_answer"),
  prompt: z.string().min(3),
  marks: z.number().int().min(1).max(50).default(4),
  modelAnswer: z.string().min(1),
  explanation: z.string().optional(),
  publishedToStudents: z.boolean().default(false),
  sourceLabel: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      topic: parsed.data.topic as Topic,
      type: parsed.data.type,
      prompt: parsed.data.prompt,
      marks: parsed.data.marks,
      modelAnswer: parsed.data.modelAnswer,
      explanation: parsed.data.explanation,
      publishedToStudents: parsed.data.publishedToStudents,
      sourceLabel: parsed.data.sourceLabel,
      authorId: admin.id,
    },
  });

  return NextResponse.json({ question });
}
