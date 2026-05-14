"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  topic: string;
  prompt: string;
  marks: number;
  answerText: string;
  aiMarksAwarded: number | null;
  aiFeedback: string | null;
  modelAnswer: string | null;
  explanation: string | null;
};

export default function MockResultPage() {
  const params = useParams();
  const sp = useSearchParams();
  const mockId = params.id as string;
  const attemptId = params.attemptId as string;
  const timedOut = sp.get("timeout") === "1";

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [release, setRelease] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mocks/${mockId}/attempt/${attemptId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed");
        return json.attempt as {
          title: string;
          submitted: boolean;
          totalScore: number | null;
          maxMarks: number | null;
          markingGuideReleased: boolean;
          questions: Row[];
        };
      })
      .then((a) => {
        if (!a.submitted) {
          window.location.replace(`/study/mocks/${mockId}/take/${attemptId}`);
          return;
        }
        setTitle(a.title);
        setTotal(a.totalScore);
        setMax(a.maxMarks);
        setRelease(a.markingGuideReleased);
        setRows(a.questions);
      })
      .catch((e: Error) => setError(e.message));
  }, [attemptId, mockId]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {error}
      </main>
    );
  }

  if (!rows.length && !error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Loading results…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results</p>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {total != null && max != null && (
          <p className="text-lg text-foreground">
            Score <span className="font-semibold text-primary">{total}</span> / <span className="font-semibold">{max}</span>
          </p>
        )}
        {timedOut && <p className="text-sm text-warning">Time expired — paper was submitted automatically.</p>}
        {!release && (
          <p className="text-sm text-muted-foreground">
            Model answers and examiner notes will appear here when your instructor releases the marking guide. AI feedback for each item is shown below.
          </p>
        )}
      </header>

      <div className="space-y-4">
        {rows.map((r, i) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Question {i + 1} · {r.aiMarksAwarded ?? 0}/{r.marks} marks
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap text-foreground/90">{r.prompt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Your answer</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{r.answerText || "—"}</p>
              </div>
              {r.aiFeedback && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">AI feedback</p>
                  <p className="mt-1 text-muted-foreground">{r.aiFeedback}</p>
                </div>
              )}
              {release && r.modelAnswer && (
                <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase text-primary">Marking guide</p>
                  <p className="mt-1 whitespace-pre-wrap">{r.modelAnswer}</p>
                  {r.explanation && <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.explanation}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" asChild>
        <Link href="/study/mocks">All mocks</Link>
      </Button>
    </main>
  );
}
