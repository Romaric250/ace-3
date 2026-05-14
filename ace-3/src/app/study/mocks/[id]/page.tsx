"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

type MockDetail = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  focus: string;
  markingGuideReleased: boolean;
  questionCount: number;
  inProgressAttemptId: string | null;
  inProgressStartedAt: string | null;
  lastAttempt: { id: string; submittedAt: string; totalScore: number | null; maxMarks: number | null } | null;
};

export default function MockBriefingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [mock, setMock] = useState<MockDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch(`/api/mocks/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        return data.mock as MockDetail;
      })
      .then((m) => {
        if (!cancel) setMock(m);
      })
      .catch((e: Error) => {
        if (!cancel) setError(e.message);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  const resume = () => {
    if (mock?.inProgressAttemptId) {
      router.push(`/study/mocks/${id}/take/${mock.inProgressAttemptId}`);
    }
  };

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/mocks/${id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start");
      router.push(`/study/mocks/${id}/take/${data.attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  };

  if (error && !mock) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {error}{" "}
        <Link href="/study/mocks" className="text-primary underline">
          Back
        </Link>
      </main>
    );
  }

  if (!mock) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Loading briefing…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">{mock.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {mock.durationMinutes} minutes · timer runs automatically
            </span>
            <span>{mock.questionCount} questions</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Enter your answers in the form. You may save progress automatically while online. Submit when finished; AI marking allows for typos when the
            reasoning matches the mark scheme.
          </p>
          {mock.description && <p className="whitespace-pre-wrap text-foreground/90">{mock.description}</p>}
          {mock.lastAttempt && (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
              Last submission: {new Date(mock.lastAttempt.submittedAt).toLocaleString()}
              {mock.lastAttempt.totalScore != null && mock.lastAttempt.maxMarks != null && (
                <>
                  {" "}
                  · Score {mock.lastAttempt.totalScore}/{mock.lastAttempt.maxMarks}
                </>
              )}
              .{" "}
              <Link href={`/study/mocks/${id}/result/${mock.lastAttempt.id}`} className="font-medium text-primary hover:underline">
                View results
              </Link>
            </p>
          )}
          {error && <p className="text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {mock.inProgressAttemptId ? (
              <Button size="lg" onClick={resume}>
                Resume sitting
              </Button>
            ) : (
              <Button size="lg" disabled={busy} onClick={() => void start()}>
                {busy ? "Starting…" : "Start exam"}
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="/study/mocks">Back to list</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
