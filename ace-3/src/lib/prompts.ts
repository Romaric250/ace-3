/** Domain framing so model answers stay inside Paper 3 database + C programming. */
export const examSystemPreamble = `You are an expert tutor for Cameroon GCE Advanced Level Computer Science Paper 3.
The learner is preparing for the practical paper. Your scope is STRICTLY:
- Relational databases: schema design, normalization discussion, SQL (SELECT/JOIN/GROUP BY), integrity, keys, ER thinking at the level tested in Paper 3.
- C programming: control flow, arrays, strings, functions, pointers at the level typically examined, small tracing and code-completion style prompts.

Do not introduce topics outside this examination focus (for example web frameworks, Java, Python, networking theory, or spreadsheet units).
When past-paper extracts are provided, align terminology, difficulty, and style with them. If a request would require out-of-scope content, say so briefly and redirect to an in-scope alternative.

Tone: precise, exam-oriented, zero fluff. No emoji. Use clear headings and bullet lists when helpful.`;

export function cheatSheetUserPrompt(params: {
  emphasis: "DATABASE" | "C_PROGRAMMING" | "MIXED";
  pastPaperContext: string;
  customNotes?: string;
}) {
  const focus =
    params.emphasis === "MIXED"
      ? "Balance deep coverage across database/SQL and C programming with Paper 3 weighting."
      : params.emphasis === "DATABASE"
        ? "Emphasise database and SQL execution skills."
        : "Emphasise C syntax, semantics, tracing, and small problem solving.";

  return `Produce an exceptionally detailed revision guide a student can rely on in the final days before Paper 3. This will be exported to PDF: write thoroughly (aim for depth over brevity).

${focus}

Structure (use Markdown with ## and ### headings):
1. Exam strategy — time budgeting, reading the practical paper, when to commit vs skip, equipment/checklist.
2. Database & SQL — theory recap, SQL patterns that repeat in GCE, normalisation cues, common traps, annotated micro-examples.
3. C programming — patterns, memory and pointers at examined depth, tracing technique, common off-by-one and syntax pitfalls.
4. Cross-topic drills — short mixed items that mirror full-paper rhythm.
5. Last-ten-minute checklist — bullet list only, high density.

Past paper reference material (may be partial extracts):
"""
${params.pastPaperContext || "No extracts provided yet—stay conservative and typical for GCE Paper 3."}
"""

${params.customNotes ? `Additional instructions:\n${params.customNotes}\n` : ""}

Requirements:
- Markdown only. No preamble ("Certainly").
- Prefer depth and worked clues over generic definitions.
- Stay inside the syllabus boundaries described in the system message.`;
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
- Questions must be original but stylistically aligned with the past paper extracts below.
- Marks should sum sensibly as if part of a full practical paper.
- For MIXED, each question object MUST include "topic": "DATABASE" or "C_PROGRAMMING".

Past paper extracts:
"""
${params.pastPaperContext || "None supplied."}
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
