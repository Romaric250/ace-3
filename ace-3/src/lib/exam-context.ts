import { prisma } from "@/lib/prisma";

const MAX_CONTEXT_CHARS = 120_000;

export async function buildPastPaperContextBlock() {
  const uploads = await prisma.pastPaperUpload.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { title: true, rawText: true },
  });

  if (uploads.length === 0) return "";

  const assembled = uploads
    .map((u) => `### ${u.title}\n${u.rawText}`)
    .join("\n\n");

  return assembled.length > MAX_CONTEXT_CHARS
    ? `${assembled.slice(0, MAX_CONTEXT_CHARS)}\n\n[context truncated]`
    : assembled;
}
