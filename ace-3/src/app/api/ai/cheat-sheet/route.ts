import { NextResponse } from "next/server";
import { z } from "zod";
import { Topic } from "@prisma/client";
import { getOpenAI } from "@/lib/openai";
import { examSystemPreamble, cheatSheetUserPrompt } from "@/lib/prompts";
import { buildPastPaperContextBlock } from "@/lib/exam-context";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const bodySchema = z.object({
  emphasis: z.enum(["DATABASE", "C_PROGRAMMING", "MIXED"]),
  title: z.string().min(3).max(120).optional(),
  notes: z.string().max(4000).optional(),
  publish: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const past = await buildPastPaperContextBlock();
    const prompt = cheatSheetUserPrompt({
      emphasis: parsed.data.emphasis,
      pastPaperContext: past,
      customNotes: parsed.data.notes,
    });

    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const client = getOpenAI();

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.35,
      /** Long-form revision PDF body (multi-page detail). */
      max_completion_tokens: 12_000,
      messages: [
        { role: "system", content: examSystemPreamble },
        { role: "user", content: prompt },
      ],
    });

    const markdown = completion.choices[0]?.message?.content?.trim();
    if (!markdown) {
      return NextResponse.json({ error: "Model returned an empty document." }, { status: 502 });
    }

    const emphasisTopic =
      parsed.data.emphasis === "MIXED"
        ? Topic.MIXED
        : parsed.data.emphasis === "DATABASE"
          ? Topic.DATABASE
          : Topic.C_PROGRAMMING;

    const sheet = await prisma.cheatSheet.create({
      data: {
        userId: user.id,
        title:
          parsed.data.title ??
          `Paper 3 revision guide · ${parsed.data.emphasis.replace("_", " ").toLowerCase()}`,
        markdown,
        emphasisTopic,
        publishedToStudents: parsed.data.publish,
      },
    });

    return NextResponse.json({
      id: sheet.id,
      title: sheet.title,
      markdown: sheet.markdown,
      createdAt: sheet.createdAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}
