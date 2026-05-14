"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TopicFilter = "all" | "DATABASE" | "C_PROGRAMMING" | "MIXED";

type QuestionRow = {
  id: string;
  topic: string;
  prompt: string;
  marks: number;
  createdAt: string;
};

type SubmitResult = {
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
  modelAnswer: string;
  explanation: string | null;
};

export default function PracticeBankPage() {
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [rows, setRows] = useState<QuestionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const qs = useMemo(() => (topic === "all" ? "" : `?topic=${topic}`), [topic]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/questions${qs}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        return data.questions as QuestionRow[];
      })
      .then((q) => {
        if (!cancelled) setRows(q);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [qs]);

  const selected = selectedId ? rows?.find((r) => r.id === selectedId) : null;

  const selectQuestion = (id: string) => {
    setSelectedId(id);
    setAnswer("");
    setResult(null);
    setSubmitError(null);
    setShowSolution(false);
  };

  const submit = async () => {
    if (!selectedId) return;
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/practice/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Submit failed");
      setResult(data as SubmitResult);
      setShowSolution(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed");
    }
    setSubmitBusy(false);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Topic practice</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Choose a question, write your answer, and submit for AI marking. Your score and feedback appear immediately; the official model
            answer is shown after you submit. For timed mocks, use{" "}
            <Link href="/study/mocks" className="font-medium text-primary underline-offset-4 hover:underline">
              mock examinations
            </Link>
            .
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/study/mocks">Go to mocks</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all" as const, label: "All published" },
            { id: "MIXED", label: "Mixed" },
            { id: "DATABASE", label: "Database" },
            { id: "C_PROGRAMMING", label: "C programming" },
          ] as const
        ).map((t) => (
          <Button key={t.id} type="button" size="sm" variant={topic === t.id ? "default" : "secondary"} onClick={() => setTopic(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card
          className={cn(
            "flex min-h-[280px] flex-col lg:min-h-[520px]",
            selectedId ? "hidden lg:flex" : "flex",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Questions</CardTitle>
            <CardDescription className="text-xs">Tap a row to practise. Newest first.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[min(60vh,520px)] space-y-1 overflow-y-auto pr-1">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!rows && <p className="text-sm text-muted-foreground">Loading…</p>}
            {rows && rows.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions match this filter yet.</p>
            )}
            {rows?.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => selectQuestion(q.id)}
                className={`flex w-full items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedId === q.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/30 hover:bg-muted/60"
                }`}
              >
                <ChevronRight className={`mt-0.5 size-4 shrink-0 ${selectedId === q.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{q.topic.replaceAll("_", " ")}</span>
                    <span>·</span>
                    <span>{q.marks} marks</span>
                  </span>
                  <span className="mt-1 line-clamp-3 whitespace-pre-wrap text-foreground">{q.prompt}</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "flex min-h-[320px] flex-col",
            !selectedId ? "hidden lg:flex" : "flex",
          )}
        >
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="text-base">Your attempt</CardTitle>
              <CardDescription>
                {selected ? `${selected.topic.replaceAll("_", " ")} · ${selected.marks} marks` : "Select a question from the list."}
              </CardDescription>
            </div>
            {selected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 lg:hidden"
                onClick={() => {
                  setSelectedId(null);
                  setResult(null);
                  setAnswer("");
                  setShowSolution(false);
                  setSubmitError(null);
                }}
              >
                <ArrowLeft className="size-4" />
                List
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {!selected && <p className="text-sm text-muted-foreground">Pick a question to read the full prompt and enter your answer.</p>}

            {selected && (
              <>
                <div className="rounded-[var(--radius-md)] border border-border bg-muted/30 px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected.prompt}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practice-answer">Your answer</Label>
                  <Textarea
                    id="practice-answer"
                    className="min-h-[180px] resize-y font-mono text-sm"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here, then submit for marking."
                    disabled={submitBusy}
                  />
                </div>

                {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="gap-2" disabled={submitBusy} onClick={() => void submit()}>
                    {submitBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Marking…
                      </>
                    ) : (
                      "Submit for marking"
                    )}
                  </Button>
                  {result && (
                    <Button type="button" variant="outline" onClick={() => setShowSolution((s) => !s)}>
                      {showSolution ? "Hide model answer" : "Show model answer"}
                    </Button>
                  )}
                </div>

                {result && (
                  <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-card/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <CheckCircle2 className="size-5 text-primary" />
                      <span className="font-display text-lg font-semibold">
                        Score: {result.marksAwarded} / {result.maxMarks}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{result.feedback}</p>
                    </div>
                    {showSolution && (
                      <div className="space-y-2 border-t border-border pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model answer</p>
                        <div className="rounded-md border border-border bg-background/80 px-3 py-2">
                          <p className="whitespace-pre-wrap text-sm text-foreground">{result.modelAnswer}</p>
                        </div>
                        {result.explanation && (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.explanation}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
