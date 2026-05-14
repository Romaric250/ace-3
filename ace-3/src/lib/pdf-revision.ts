import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const FONT_SIZE = 10;
const LINE_GAP = 12;
const MAX_CHARS = 92;

function wrapParagraph(text: string): string[] {
  const out: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) return [""];
  let rest = trimmed;
  while (rest.length > MAX_CHARS) {
    let cut = rest.lastIndexOf(" ", MAX_CHARS);
    if (cut < MAX_CHARS / 2) cut = MAX_CHARS;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

function linesFromBody(body: string): { text: string; bold: boolean }[] {
  const result: { text: string; bold: boolean }[] = [];
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      result.push({ text: "", bold: false });
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].replace(/[*_`]/g, "");
      result.push({ text, bold: true });
      if (level <= 2) result.push({ text: "", bold: false });
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      for (const w of wrapParagraph(`• ${bullet[1].replace(/[*_`]/g, "")}`)) {
        result.push({ text: w, bold: false });
      }
      continue;
    }
    for (const w of wrapParagraph(line.replace(/[*_`#]/g, ""))) {
      result.push({ text: w, bold: false });
    }
  }
  return result;
}

/** Builds a printable A4 PDF from Markdown-style revision content. */
export async function buildRevisionPdf(title: string, body: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (need: number) => {
    if (y - need < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const draw = (text: string, bold: boolean, size: number) => {
    if (!text) {
      y -= LINE_GAP / 2;
      return;
    }
    ensureSpace(LINE_GAP);
    page.drawText(text, {
      x: MARGIN,
      y: y - FONT_SIZE,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.08, 0.08, 0.1),
    });
    y -= LINE_GAP + (size > FONT_SIZE ? 4 : 0);
  };

  draw(title, true, 16);
  y -= 8;
  draw("Ace Paper Master · Computer Science Paper 3", false, 9);
  y -= 16;

  for (const { text, bold } of linesFromBody(body)) {
    draw(text, bold, bold && text.length < 80 ? 12 : FONT_SIZE);
  }

  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText(`Page ${i + 1} / ${pages.length}`, {
      x: MARGIN,
      y: 28,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.5),
    });
  }

  return pdf.save();
}
