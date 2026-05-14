import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import { examSystemPreamble, tutorUserPrompt } from "@/lib/prompts";
import { buildPastPaperContextBlock } from "@/lib/exam-context";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

const bodySchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { message, conversationId } = parsed.data;

    let conversation =
      conversationId != null
        ? await prisma.chatConversation.findFirst({
            where: { id: conversationId, userId: user.id },
          })
        : null;

    if (conversationId && !conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId: user.id,
          title: message.slice(0, 72),
        },
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const history = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 48,
    });

    const past = await buildPastPaperContextBlock();
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const client = getOpenAI();

    const contextualised = history.map((m, idx) => {
      const isLatest = idx === history.length - 1;
      if (m.role === "user" && isLatest) {
        return { role: "user" as const, content: tutorUserPrompt(m.content, past) };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [{ role: "system", content: examSystemPreamble }, ...contextualised],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Model returned an empty response." }, { status: 502 });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chat request failed." }, { status: 500 });
  }
}
