import { NextResponse } from "next/server";
import { Topic } from "@prisma/client";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** Published items only — never exposes model answers (use timed mocks for submission + AI marking). */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") as Topic | null;
  const topicOk =
    topic === "DATABASE" || topic === "C_PROGRAMMING" || topic === "MIXED" ? topic : null;

  const where = topicOk
    ? { publishedToStudents: true as const, topic: topicOk }
    : { publishedToStudents: true as const };

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      type: true,
      prompt: true,
      marks: true,
      createdAt: true,
    },
    take: 200,
  });

  return NextResponse.json({ questions });
}
