"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type TopicFilter = "all" | "DATABASE" | "C_PROGRAMMING" | "MIXED";

type QuestionRow = {
  id: string;
  topic: string;
  prompt: string;
  marks: number;
  sourceLabel?: string | null;
  createdAt: string;
};

export default function PracticeBankPage() {
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [rows, setRows] = useState<QuestionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Topic practice</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Prompts and mark schemes for self-study only—model answers are not shown here. For timed papers, AI marking, and released
            guides, use{" "}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question bank</CardTitle>
          <CardDescription>Last 200 published items, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!rows && <p className="text-sm text-muted-foreground">Loading…</p>}
          {rows && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No questions match this filter yet.</p>
          )}
          {rows?.map((q) => (
            <div
              key={q.id}
              className="rounded-[var(--radius-md)] border border-border bg-card/40 px-4 py-3 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">{q.topic.replaceAll("_", " ")}</span>
                <span>{q.marks} marks</span>
                {q.sourceLabel && <span className="text-primary/90">{q.sourceLabel}</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-foreground">{q.prompt}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
