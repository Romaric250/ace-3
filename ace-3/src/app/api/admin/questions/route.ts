import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import { examSystemPreamble, questionBatchUserPrompt } from "@/lib/prompts";
import { buildPastPaperContextBlock } from "@/lib/exam-context";
import { Topic } from "@prisma/client";

const generateSchema = z.object({
  topic: z.enum(["DATABASE", "C_PROGRAMMING", "MIXED"]),
  count: z.coerce.number().int().min(1).max(24).default(8),
  difficulty: z.enum(["foundation", "standard", "stretch"]).default("standard"),
  notes: z.string().max(2000).optional(),
  publish: z.coerce.boolean().default(false),
});

const questionSchema = z.object({
  questions: z.array(
    z.object({
      topic: z.enum(["DATABASE", "C_PROGRAMMING"]).optional(),
      prompt: z.string(),
      type: z.string().default("short_answer"),
      marks: z.number().int().min(1).max(25),
      modelAnswer: z.string(),
      explanation: z.string().optional(),
    }),
  ),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const json = await req.json();
    const parsed = generateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const past = await buildPastPaperContextBlock();
    const userPrompt = questionBatchUserPrompt({
      topic: parsed.data.topic,
      count: parsed.data.count,
      difficulty: parsed.data.difficulty,
      pastPaperContext: past,
      notes: parsed.data.notes,
    });

    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const client = getOpenAI();

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${examSystemPreamble}\nYou write JSON only.` },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return NextResponse.json({ error: "Empty model output" }, { status: 502 });

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
    }

    const checked = questionSchema.safeParse(payload);
    if (!checked.success) {
      return NextResponse.json({ error: "Unexpected JSON shape from model." }, { status: 502 });
    }

    const batchTopic = parsed.data.topic;

    const created = await Promise.all(
      checked.data.questions.map((q) => {
        let topic: Topic;
        if (batchTopic === "MIXED") {
          topic = q.topic === "C_PROGRAMMING" ? Topic.C_PROGRAMMING : Topic.DATABASE;
        } else {
          topic = batchTopic as Topic;
        }
        return prisma.question.create({
          data: {
            topic,
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            modelAnswer: q.modelAnswer,
            explanation: q.explanation,
            publishedToStudents: parsed.data.publish,
            authorId: admin.id,
            sourceLabel:
              batchTopic === "MIXED"
                ? `ai_mixed_${parsed.data.difficulty}`
                : `ai_batch_${parsed.data.difficulty}`,
          },
        });
      }),
    );

    return NextResponse.json({ created: created.length, ids: created.map((c) => c.id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}
