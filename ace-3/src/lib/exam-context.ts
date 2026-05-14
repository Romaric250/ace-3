import { prisma } from "@/lib/prisma";

const MAX_CONTEXT_CHARS = 160_000;

/** Assemble rich context from stored uploads for AI (revision guides + question batches). */
export async function buildPastPaperContextBlock() {
  const uploads = await prisma.pastPaperUpload.findMany({
    orderBy: { createdAt: "desc" },
    take: 16,
    select: { title: true, notes: true, rawText: true, fileUrl: true, fileName: true },
  });

  if (uploads.length === 0) return "";

  const blocks = uploads.map((u) => {
    const meta: string[] = [`### ${u.title}`];
    if (u.notes?.trim()) meta.push(`Admin notes: ${u.notes.trim()}`);
    if (u.fileUrl?.trim()) {
      meta.push(`Attached file: ${u.fileName?.trim() || "upload"} — ${u.fileUrl.trim()}`);
    }
    const body = u.rawText?.trim()
      ? u.rawText.trim()
      : "(No pasted OCR text for this entry — use the title, notes, and file reference above plus typical Paper 3 patterns.)";
    meta.push(body);
    return meta.join("\n");
  });

  const assembled = blocks.join("\n\n---\n\n");

  return assembled.length > MAX_CONTEXT_CHARS
    ? `${assembled.slice(0, MAX_CONTEXT_CHARS)}\n\n[context truncated for length]`
    : assembled;
}
