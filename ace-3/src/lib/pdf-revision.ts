import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 30;
const HEADER_BAR_Y = PAGE_H - 36;
const BODY_Y_START = PAGE_H - 68;

const ACCENT = rgb(0.06, 0.42, 0.4);
const ACCENT_LIGHT = rgb(0.88, 0.95, 0.93);
const MUTED = rgb(0.38, 0.4, 0.45);
const TEXT = rgb(0.11, 0.13, 0.17);
const CODE_BG = rgb(0.94, 0.95, 0.96);

export type RevisionBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "p"; text: string }
  | { type: "bullet"; text: string }
  | { type: "code"; lines: string[] }
  | { type: "blank" };

export function parseRevisionMarkdown(body: string): RevisionBlock[] {
  const blocks: RevisionBlock[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let codeBuf: string[] | null = null;

  while (i < lines.length) {
    const raw = lines[i]!;
    const line = raw.trimEnd();

    if (codeBuf !== null) {
      if (line.trim() === "```") {
        blocks.push({ type: "code", lines: codeBuf });
        codeBuf = null;
      } else codeBuf.push(raw);
      i++;
      continue;
    }

    if (line.trim() === "```") {
      codeBuf = [];
      i++;
      continue;
    }

    if (!line.trim()) {
      blocks.push({ type: "blank" });
      i++;
      continue;
    }

    const h2 = /^#{2}\s+(.+)$/.exec(line);
    if (h2) {
      blocks.push({ type: "h2", text: stripMd(h2[1]!) });
      i++;
      continue;
    }
    const h3 = /^#{3}\s+(.+)$/.exec(line);
    if (h3) {
      blocks.push({ type: "h3", text: stripMd(h3[1]!) });
      i++;
      continue;
    }
    const h4 = /^#{4}\s+(.+)$/.exec(line);
    if (h4) {
      blocks.push({ type: "h4", text: stripMd(h4[1]!) });
      i++;
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      blocks.push({ type: "bullet", text: stripMd(bullet[1]!) });
      i++;
      continue;
    }
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (ordered) {
      blocks.push({ type: "bullet", text: stripMd(ordered[1]!) });
      i++;
      continue;
    }

    blocks.push({ type: "p", text: stripMd(line) });
    i++;
  }

  return blocks;
}

function stripMd(s: string): string {
  return s.replace(/[*_`]/g, "").trim();
}

export function collectH2Titles(blocks: RevisionBlock[]): string[] {
  return blocks.filter((b): b is { type: "h2"; text: string } => b.type === "h2").map((b) => b.text);
}

function wrapToWidth(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length === 0 || words[0] === "") return [];
  const lines: string[] = [];
  let line = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const w = words[i]!;
    const test = `${line} ${w}`;
    if (font.widthOfTextAtSize(test, size) <= maxW) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  lines.push(line);
  return lines;
}

function drawCover(page: PDFPage, title: string, font: PDFFont, fontBold: PDFFont, dateStr: string) {
  const mid = PAGE_W / 2;
  page.drawRectangle({ x: 0, y: PAGE_H - 100, width: PAGE_W, height: 100, color: ACCENT });
  const ribbon = "ACE PAPER MASTER · GCE COMPUTER SCIENCE";
  page.drawText(ribbon, {
    x: mid - fontBold.widthOfTextAtSize(ribbon, 9) / 2,
    y: PAGE_H - 58,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  let ty = PAGE_H - 160;
  const titleSize = title.length > 70 ? 17 : 21;
  for (const tl of wrapToWidth(title, fontBold, titleSize, CONTENT_W)) {
    page.drawText(tl, {
      x: mid - fontBold.widthOfTextAtSize(tl, titleSize) / 2,
      y: ty,
      size: titleSize,
      font: fontBold,
      color: TEXT,
    });
    ty -= titleSize + 5;
  }

  const sub = "Paper 3 · Revision guide (detailed)";
  page.drawText(sub, {
    x: mid - font.widthOfTextAtSize(sub, 11) / 2,
    y: ty - 8,
    size: 11,
    font,
    color: MUTED,
  });

  page.drawRectangle({ x: MARGIN, y: ty - 48, width: CONTENT_W, height: 1, color: ACCENT });
  const hint =
    "Use this document alongside past papers and timed mocks. Sections follow GCE-style depth: relational theory, SQL patterns, and C without pointers.";
  let hy = ty - 72;
  for (const ln of wrapToWidth(hint, font, 9.5, CONTENT_W)) {
    page.drawText(ln, { x: MARGIN, y: hy, size: 9.5, font, color: MUTED });
    hy -= 12;
  }

  page.drawText(`Generated · ${dateStr}`, {
    x: MARGIN,
    y: MARGIN - 8,
    size: 8,
    font,
    color: MUTED,
  });
}

function drawPageHeader(page: PDFPage, font: PDFFont, shortTitle: string) {
  page.drawRectangle({ x: 0, y: HEADER_BAR_Y - 4, width: PAGE_W, height: 20, color: ACCENT_LIGHT });
  page.drawLine({
    start: { x: MARGIN, y: HEADER_BAR_Y + 14 },
    end: { x: PAGE_W - MARGIN, y: HEADER_BAR_Y + 14 },
    thickness: 1,
    color: ACCENT,
  });
  const left = "Paper 3 revision guide";
  page.drawText(left, { x: MARGIN + 4, y: HEADER_BAR_Y, size: 8.5, font, color: ACCENT });
  const right = shortTitle.length > 40 ? `${shortTitle.slice(0, 38)}…` : shortTitle;
  const tw = font.widthOfTextAtSize(right, 8.5);
  page.drawText(right, { x: PAGE_W - MARGIN - tw - 4, y: HEADER_BAR_Y, size: 8.5, font, color: MUTED });
}

function drawFooters(pages: PDFPage[], font: PDFFont) {
  const n = pages.length;
  for (let i = 0; i < n; i++) {
    if (i === 0) continue;
    const p = pages[i]!;
    const label = `Page ${i + 1} of ${n}`;
    p.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 14 },
      end: { x: PAGE_W - MARGIN, y: FOOTER_Y + 14 },
      thickness: 0.35,
      color: rgb(0.86, 0.88, 0.9),
    });
    p.drawText("Ace Paper Master", { x: MARGIN, y: FOOTER_Y, size: 8, font, color: MUTED });
    p.drawText(label, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 8),
      y: FOOTER_Y,
      size: 8,
      font,
      color: MUTED,
    });
  }
}

const FILLER_CHECKLIST = [
  "Arrive with acceptable stationery and rough paper if your centre allows it.",
  "Read every question stem twice; underline command words (state, explain, write SQL, trace).",
  "For SQL: sketch the ER or table links mentally before writing JOINs.",
  "For C: trace loops on paper with a small table (i, value); avoid guessing output.",
  "Reserve the last minutes to copy answers neatly and check bracket matching in C.",
];

/** Builds a styled multi-page A4 PDF (cover, contents, body; minimum 3 pages). */
export async function buildRevisionPdf(title: string, body: string): Promise<Uint8Array> {
  const blocks = parseRevisionMarkdown(body);
  const toc = collectH2Titles(blocks);
  const shortTitle = title.length > 48 ? `${title.slice(0, 46)}…` : title;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdf.embedFont(StandardFonts.Courier);

  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  drawCover(pdf.addPage([PAGE_W, PAGE_H]), title, font, fontBold, dateStr);

  const tocPage = pdf.addPage([PAGE_W, PAGE_H]);
  drawPageHeader(tocPage, font, shortTitle);
  let tocY = BODY_Y_START;
  tocPage.drawText("Contents", { x: MARGIN, y: tocY, size: 17, font: fontBold, color: ACCENT });
  tocY -= 26;
  tocPage.drawText("Major sections in this guide:", { x: MARGIN, y: tocY, size: 10, font, color: MUTED });
  tocY -= 18;

  if (toc.length === 0) {
    tocPage.drawText("(Sections follow the body of your generated guide.)", {
      x: MARGIN,
      y: tocY,
      size: 10,
      font,
      color: MUTED,
    });
    tocY -= 14;
  } else {
    for (let i = 0; i < toc.length; i++) {
      const entry = `${i + 1}. ${toc[i]!}`;
      const wrapped = wrapToWidth(entry, font, 10, CONTENT_W - 8);
      for (const ln of wrapped) {
        if (tocY < MARGIN + 100) {
          tocPage.drawText("(continued…)", { x: MARGIN, y: tocY, size: 9, font, color: MUTED });
          break;
        }
        tocPage.drawText(ln, { x: MARGIN + 6, y: tocY, size: 10, font, color: TEXT });
        tocY -= 13;
      }
      tocY -= 4;
    }
  }

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  drawPageHeader(page, font, shortTitle);
  let y = BODY_Y_START;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    drawPageHeader(page, font, shortTitle);
    y = BODY_Y_START;
  };

  const ensureGap = (gap: number) => {
    if (y - gap < MARGIN + 52) newPage();
  };

  for (const b of blocks) {
    if (b.type === "blank") {
      y -= 8;
      continue;
    }

    if (b.type === "h2") {
      ensureGap(56);
      page.drawRectangle({ x: MARGIN, y: y - 3, width: 4, height: 18, color: ACCENT });
      page.drawText(b.text, { x: MARGIN + 12, y: y - 2, size: 14, font: fontBold, color: TEXT });
      y -= 28;
      page.drawLine({
        start: { x: MARGIN, y: y + 8 },
        end: { x: PAGE_W - MARGIN, y: y + 8 },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.92),
      });
      y -= 12;
      continue;
    }

    if (b.type === "h3") {
      ensureGap(36);
      page.drawText(b.text, { x: MARGIN, y: y, size: 12, font: fontBold, color: ACCENT });
      y -= 20;
      continue;
    }

    if (b.type === "h4") {
      ensureGap(30);
      page.drawText(b.text, { x: MARGIN, y: y, size: 11, font: fontBold, color: TEXT });
      y -= 16;
      continue;
    }

    if (b.type === "bullet") {
      ensureGap(22);
      const bulletX = MARGIN + 10;
      const textX = MARGIN + 22;
      const maxW = CONTENT_W - 24;
      page.drawText("•", { x: bulletX, y: y, size: 10, font: fontBold, color: ACCENT });
      const lines = wrapToWidth(b.text, font, 10, maxW);
      for (const ln of lines) {
        ensureGap(14);
        page.drawText(ln, { x: textX, y: y, size: 10, font, color: TEXT });
        y -= 13;
      }
      y -= 4;
      continue;
    }

    if (b.type === "code") {
      ensureGap(40);
      const pad = 6;
      const lines = b.lines.length ? b.lines : [""];
      const lh = 11;
      const codeSize = 8.5;
      let maxLineW = 40;
      for (const raw of lines) {
        const s = raw.length > 92 ? `${raw.slice(0, 90)}…` : raw;
        const w = fontMono.widthOfTextAtSize(s, codeSize);
        if (w > maxLineW) maxLineW = Math.min(w, CONTENT_W - pad * 2);
      }
      const boxH = lines.length * lh + pad * 2;
      ensureGap(boxH + 10);
      page.drawRectangle({
        x: MARGIN,
        y: y - boxH,
        width: CONTENT_W,
        height: boxH,
        color: CODE_BG,
        borderColor: rgb(0.82, 0.85, 0.88),
        borderWidth: 0.5,
      });
      let cy = y - pad - codeSize;
      for (const raw of lines) {
        const s = raw.length > 92 ? `${raw.slice(0, 90)}…` : raw;
        page.drawText(s, { x: MARGIN + pad, y: cy, size: codeSize, font: fontMono, color: rgb(0.15, 0.18, 0.22) });
        cy -= lh;
      }
      y -= boxH + 12;
      continue;
    }

    if (b.type === "p") {
      const lines = wrapToWidth(b.text, font, 10, CONTENT_W);
      for (const ln of lines) {
        ensureGap(14);
        page.drawText(ln, { x: MARGIN, y: y, size: 10, font, color: TEXT });
        y -= 13;
      }
      y -= 6;
    }
  }

  while (pdf.getPageCount() < 3) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    drawPageHeader(page, font, shortTitle);
    y = BODY_Y_START;
    page.drawText("Exam-day focus", { x: MARGIN, y: y, size: 13, font: fontBold, color: ACCENT });
    y -= 22;
    for (const line of FILLER_CHECKLIST) {
      for (const ln of wrapToWidth(line, font, 10, CONTENT_W - 18)) {
        if (y < MARGIN + 60) break;
        page.drawText("•", { x: MARGIN + 4, y: y, size: 10, font: fontBold, color: ACCENT });
        page.drawText(ln, { x: MARGIN + 18, y: y, size: 10, font, color: TEXT });
        y -= 13;
      }
      y -= 6;
    }
  }

  drawFooters(pdf.getPages(), font);
  return pdf.save();
}
