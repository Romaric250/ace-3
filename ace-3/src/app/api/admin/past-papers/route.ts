import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    title: z.string().min(2).max(200),
    notes: z.string().max(2000).optional(),
    rawText: z.string().max(500_000).default(""),
    fileUrl: z.string().url().optional(),
    fileName: z.string().max(300).optional(),
  })
  .refine((d) => d.rawText.trim().length >= 20 || Boolean(d.fileUrl), {
    message: "Provide at least 20 characters of text or a file URL from upload.",
  });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const uploads = await prisma.pastPaperUpload.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true, name: true } } },
  });

  return NextResponse.json({ uploads });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const upload = await prisma.pastPaperUpload.create({
    data: {
      title: parsed.data.title,
      notes: parsed.data.notes,
      rawText: parsed.data.rawText.trim() || "(see attached file)",
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName,
      createdById: admin.id,
    },
  });

  return NextResponse.json({ upload });
}
