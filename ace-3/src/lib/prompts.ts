/** Domain framing so model answers stay inside Paper 3 database + C programming. */
export const examSystemPreamble = `You are an expert tutor for Cameroon GCE Advanced Level Computer Science Paper 3.
The learner is preparing for the practical paper. Your scope is STRICTLY:
- Relational databases: ER modelling, cardinalities and relationships, schema design, keys, integrity, normalisation discussion, SQL (SELECT/JOIN/GROUP BY/HAVING), and relational theory at Paper 3 depth.
- C programming: control flow, arrays (including char arrays for strings), strings via library functions where appropriate, structs if relevant to the syllabus, functions, tracing, and small coding tasks. Do NOT use pointers, pointer notation (*, &, pointer parameters), dynamic allocation, or address arithmetic in explanations, examples, sample questions, or revision notes unless the user explicitly opts in.

Do not introduce topics outside this examination focus (for example web frameworks, Java, Python, networking theory, or spreadsheet units).
When past-paper extracts or file references are provided in the user message, you MUST treat them as primary grounding: mirror their phrasing style, mark allocation patterns, and topic mix. If extracts are thin, stay conservative and typical for GCE Paper 3 rather than inventing niche topics.

Tone: precise, exam-oriented, zero fluff. No emoji. Use clear Markdown headings (##, ###), dense paragraphs, and bullet lists where they aid memory.`;

export function cheatSheetUserPrompt(params: {
  emphasis: "DATABASE" | "C_PROGRAMMING" | "MIXED";
  pastPaperContext: string;
  customNotes?: string;
}) {
  const focus =
    params.emphasis === "MIXED"
      ? "Balance deep coverage across database/SQL and C programming with realistic Paper 3 weighting. The database half MUST begin with ER diagrams and relationships as specified below."
      : params.emphasis === "DATABASE"
        ? "This guide is database-heavy. It MUST open with ER diagrams, how to draw them, and cardinalities/relationships before any other database topic."
        : "This guide is C-heavy. Teach control flow, arrays, strings, functions, and tracing. Do NOT mention pointers, references, malloc/free, or pointer parameters anywhere in this document.";

  const databaseOpening = `
**Mandatory opening for any database content (DATABASE or MIXED emphasis):**
The **first** substantive revision section (first ## after any brief exam-orientation block you choose) MUST be titled clearly, e.g. "## Entity–relationship modelling" or "## ER diagrams and relationships". Inside it, BEFORE other database theory:
- Explain what an ER diagram is for and how entities, attributes, and relationships appear on paper.
- Show how to read and draw **relationships** with **cardinalities** (one-to-one, one-to-many, many-to-many). Use clear written patterns such as "one department has many employees" and show the crow's-foot / notation style appropriate to GCE (describe the symbols in words if needed).
- Give at least one **worked sketch in text form** (e.g. "Student — enrolls — Course" with cardinalities labelled) and one short narrative about converting thought patterns into SQL table ideas later.
Only after this section should normalisation, SQL patterns, and integrity topics appear.`;

  const cRestrictions = `
**C programming restrictions:** Never include pointers, address-of, dereference, pointer parameters, arrays decaying into pointers as a teaching device, malloc/calloc/realloc/free, or dynamic memory. Prefer fixed-size arrays, loop indices, and clear string handling with standard idioms that avoid pointer teaching.`;

  let step = 1;
  const outline: string[] = [];
  outline.push(
    `${step++}. **Optional short front matter** — optional "## Before you sit Paper 3": at most one short paragraph on timing and reading stems (you may skip this and fold strategy into the checklist at the end).`,
  );
  if (params.emphasis === "DATABASE" || params.emphasis === "MIXED") {
    outline.push(
      `${step++}. **Database strand** — MUST begin with the mandatory ER / relationships section above, then normalisation, keys, integrity, then SQL. Include many annotated patterns (WHERE, JOINs, GROUP BY / aggregates when relevant), common traps, and several short worked SQL fragments.`,
    );
  }
  if (params.emphasis === "C_PROGRAMMING" || params.emphasis === "MIXED") {
    outline.push(
      `${step++}. **C programming strand** — loops, arrays, character arrays and strings, functions, scope, tracing tables, off-by-one errors, syntax pitfalls. Several trace walkthroughs and small code snippets. No pointers.`,
    );
  }
  if (params.emphasis === "MIXED") {
    outline.push(
      `${step++}. **Cross-topic synthesis** — short mixed reflections mirroring full-paper rhythm; C parts obey the no-pointer rule.`,
    );
  }
  outline.push(`${step++}. **Last minutes before submission** — bullet-only dense checklist.`);

  return `Produce a **super-detailed** revision guide that will be exported to a **multi-page PDF** (target **well over three pages** of equivalent print when rendered—be expansive, not a one-page summary).

${focus}
${params.emphasis !== "C_PROGRAMMING" ? databaseOpening : ""}
${params.emphasis !== "DATABASE" ? cRestrictions : ""}

**Order and structure (Markdown with ## and ###; you may add #### where useful):**

${outline.join("\n")}

**Depth requirements:**
- Many subsections, worked examples, "exam language" callouts, and common mistakes.
- Prefer rich prose plus bullets; avoid thin bullet-only pages.
- All code examples must be valid-looking Paper-3-style C **without pointers**.

**Past paper and upload bank (PRIMARY CONTEXT — use heavily):**
Administrators store extracts and file links here. You MUST align terminology, difficulty, and question style with this material. Where the text references file attachments without full OCR, still infer typical GCE Paper 3 balance and phrasing.

"""
${params.pastPaperContext || "No extracts uploaded yet—produce a conservative but still very detailed GCE Paper 3 guide."}
"""

${params.customNotes ? `**Additional instructor notes:**\n${params.customNotes}\n` : ""}

**Output rules:**
- Markdown only. No preamble ("Certainly").
- No emoji.
- Do not shorten to hit a token limit—prioritise completeness and richness.`;
}

export function questionBatchUserPrompt(params: {
  topic: "DATABASE" | "C_PROGRAMMING" | "MIXED";
  count: number;
  difficulty: "foundation" | "standard" | "stretch";
  pastPaperContext: string;
  notes?: string;
}) {
  const topicLine =
    params.topic === "MIXED"
      ? `Mixed Paper 3 paper: include BOTH database/SQL items AND C programming items in roughly equal proportion (alternate where natural). Total count ${params.count}.`
      : params.topic === "DATABASE"
        ? `Topic: Database / SQL only.`
        : `Topic: C programming only.`;

  const jsonShape =
    params.topic === "MIXED"
      ? `{"questions":[{"topic":"DATABASE"|"C_PROGRAMMING","prompt":"...","type":"short_answer"|"trace","marks":number,"modelAnswer":"...","explanation":"..."}]}`
      : `{"questions":[{"prompt":"...","type":"short_answer"|"trace","marks":number,"modelAnswer":"...","explanation":"..."}]}`;

  return `Create exactly ${params.count} original practice questions for GCE Computer Science Paper 3.
${topicLine}
Difficulty: ${params.difficulty}.

Return a JSON object with shape:
${jsonShape}

Rules:
- Questions must be **original** but you MUST **ground style, difficulty, and vocabulary** in the past-paper bank below. Quote or paraphrase typical command words seen in the extracts when natural. If extracts are empty, stay typical for GCE Paper 3.
- Marks should sum sensibly as if part of a full practical paper.
- For MIXED, each question object MUST include "topic": "DATABASE" or "C_PROGRAMMING".
- For ANY C_PROGRAMMING item: **do not** require pointers, pointer parameters, address-of/dereference, malloc/free, or dynamic memory. Use arrays, indices, and value parameters only.
- For DATABASE items: where appropriate reflect ER/SQL emphasis consistent with the extracts.

Past paper bank (extracts and file references — use as primary context):
"""
${params.pastPaperContext || "None supplied—use typical GCE Paper 3 database + non-pointer C style."}
"""

${params.notes ? `Author notes: ${params.notes}` : ""}`;
}

export function tutorUserPrompt(latestUserMessage: string, pastPaperContext: string) {
  return `Past paper context (may be empty):
"""
${pastPaperContext}
"""

Student message:
${latestUserMessage}`;
}
