"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Q = {
  id: string;
  topic: string;
  type: string;
  prompt: string;
  marks: number;
  answerText: string;
};

type AttemptPayload = {
  id: string;
  submitted: boolean;
  endsAt: string;
  durationMinutes: number;
  title: string;
  questions: Q[];
};

export default function TakeMockPage() {
  const params = useParams();
  const router = useRouter();
  const mockId = params.id as string;
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainSec, setRemainSec] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const expiredRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const load = useCallback(() => {
    return fetch(`/api/mocks/${mockId}/attempt/${attemptId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Load failed");
        return json.attempt as AttemptPayload & {
          submittedAt: string | null;
          totalScore: number | null;
          maxMarks: number | null;
        };
      })
      .then((a) => {
        if (a.submitted) {
          router.replace(`/study/mocks/${mockId}/result/${attemptId}`);
          return null;
        }
        setData({
          id: a.id,
          submitted: false,
          endsAt: a.endsAt,
          durationMinutes: a.durationMinutes,
          title: a.title,
          questions: a.questions as Q[],
        });
        const map: Record<string, string> = {};
        for (const q of a.questions as Q[]) {
          map[q.id] = q.answerText ?? "";
        }
        setAnswers(map);
        return a;
      });
  }, [attemptId, mockId, router]);

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [load]);

  useEffect(() => {
    if (!data?.endsAt) return;
    const tick = () => {
      const end = new Date(data.endsAt).getTime();
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemainSec(s);
      if (s <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        void submit(true);
      }
    };
    tick();
    const idInt = setInterval(tick, 1000);
    return () => clearInterval(idInt);
  }, [data?.endsAt]);

  useEffect(() => {
    if (!data || data.submitted) return;
    saveTimer.current = setInterval(() => {
      void persist();
    }, 45000);
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [data?.id]);

  const persist = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const snap = answersRef.current;
      await fetch(`/api/mocks/${mockId}/attempt/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: data.questions.map((q) => ({
            questionId: q.id,
            answerText: snap[q.id] ?? "",
          })),
        }),
      });
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const submit = async (timedOut = false) => {
    if (!data || submitting) return;
    setSubmitting(true);
    setError(null);
    await persist();
    try {
      const snap = answersRef.current;
      const res = await fetch(`/api/mocks/${mockId}/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: data.questions.map((q) => ({
            questionId: q.id,
            answerText: snap[q.id] ?? "",
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submit failed");
      router.push(`/study/mocks/${mockId}/result/${attemptId}${timedOut ? "?timeout=1" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
    setSubmitting(false);
  };

  const timeLabel = useMemo(() => {
    if (remainSec == null) return "—";
    const m = Math.floor(remainSec / 60);
    const s = remainSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [remainSec]);

  if (error && !data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {error}{" "}
        <Link href="/study/mocks" className="text-primary underline">
          Back
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Preparing examination form…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="sticky top-[52px] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live sitting</p>
            <p className="font-display text-sm font-semibold">{data.title}</p>
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${remainSec !== null && remainSec < 300 ? "text-warning" : "text-primary"}`}
          >
            {timeLabel}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void persist()}>
              {saving ? "Saving…" : "Save now"}
            </Button>
            <Button type="button" size="sm" disabled={submitting} onClick={() => void submit(false)}>
              {submitting ? "Submitting…" : "Submit paper"}
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-5">
        {data.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Question {idx + 1}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · {q.marks} marks · {q.topic.replaceAll("_", " ")}
                </span>
              </CardTitle>
              <CardDescription className="text-sm text-foreground/90 whitespace-pre-wrap">{q.prompt}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor={`a-${q.id}`} className="sr-only">
                Answer
              </Label>
              <Textarea
                id={`a-${q.id}`}
                className="min-h-[120px] font-mono text-sm"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Type your answer here…"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <Button variant="outline" asChild>
          <Link href={`/study/mocks/${mockId}`}>Briefing</Link>
        </Button>
        <Button disabled={submitting} onClick={() => void submit(false)}>
          Final submit
        </Button>
      </div>
    </main>
  );
}
