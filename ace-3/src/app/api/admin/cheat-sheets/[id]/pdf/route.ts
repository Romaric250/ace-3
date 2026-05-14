import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildRevisionPdf } from "@/lib/pdf-revision";
import { UTApi, UTFile } from "uploadthing/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const sheet = await prisma.cheatSheet.findUnique({ where: { id } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBytes = await buildRevisionPdf(sheet.title, sheet.markdown);
  const buffer = Buffer.from(pdfBytes);
  const safeName = `${sheet.title.replace(/[^\w\s-]/g, "").slice(0, 60) || "revision-guide"}.pdf`;

  let pdfUrl: string | null = null;
  try {
    if (process.env.UPLOADTHING_TOKEN) {
      const utapi = new UTApi();
      const file = new UTFile([buffer], safeName, { type: "application/pdf" });
      const uploaded = await utapi.uploadFiles(file);
      const u = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      pdfUrl = u?.data?.url ?? u?.ufsUrl ?? null;
    }
  } catch (e) {
    console.error("UploadThing PDF upload failed:", e);
  }

  await prisma.cheatSheet.update({
    where: { id },
    data: {
      pdfUrl: pdfUrl ?? sheet.pdfUrl,
      pdfFileName: safeName,
    },
  });

  return NextResponse.json({
    pdfUrl,
    downloadName: safeName,
    embedded: pdfUrl == null,
    /** Base64 only when UploadThing not configured — use for local download. */
    base64: pdfUrl ? null : buffer.toString("base64"),
  });
}
