import { getOpenAI } from "@/lib/openai";
import { z } from "zod";

const resultSchema = z.object({
  marks_awarded: z.number().int(),
  feedback: z.string(),
});

export async function gradeShortAnswer(params: {
  prompt: string;
  modelAnswer: string;
  studentAnswer: string;
  maxMarks: number;
}) {
  const { prompt, modelAnswer, studentAnswer, maxMarks } = params;
  const client = getOpenAI();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You mark GCE Computer Science Paper 3 short answers. Be fair: minor spelling or spacing differences should not reduce marks if the idea is correct. Award partial credit when appropriate. Maximum marks for this item is ${maxMarks}. Respond with JSON only: {"marks_awarded": number, "feedback": string}. marks_awarded must be an integer from 0 to ${maxMarks}.`,
      },
      {
        role: "user",
        content: `Question:\n${prompt}\n\nOfficial model answer (guideline):\n${modelAnswer}\n\nStudent answer:\n${studentAnswer || "(empty)"}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty grading response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON from grader");
  }

  const checked = resultSchema.safeParse(parsed);
  if (!checked.success) throw new Error("Bad grader shape");

  let marks = checked.data.marks_awarded;
  if (marks < 0) marks = 0;
  if (marks > maxMarks) marks = maxMarks;

  return { marksAwarded: marks, feedback: checked.data.feedback };
}
