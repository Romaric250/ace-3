"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Database, FileCode2, Layers } from "lucide-react";

type Mock = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  focus: string;
  markingGuideReleased: boolean;
  questionCount: number;
};

const focusMeta: Record<string, { label: string; Icon: typeof Database }> = {
  DATABASE: { label: "Database & SQL", Icon: Database },
  C_PROGRAMMING: { label: "C programming", Icon: FileCode2 },
  MIXED: { label: "Full paper (mixed)", Icon: Layers },
};

export default function MocksListPage() {
  const [mocks, setMocks] = useState<Mock[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/mocks", { signal: ac.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load mocks");
        return data.mocks as Mock[];
      })
      .then(setMocks)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => ac.abort();
  }, []);

  const grouped = useMemo(() => {
    if (!mocks) return null;
    const g: Record<string, Mock[]> = { DATABASE: [], C_PROGRAMMING: [], MIXED: [] };
    for (const m of mocks) {
      const k = m.focus in g ? m.focus : "MIXED";
      g[k].push(m);
    }
    return g;
  }, [mocks]);

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Timed mock exams</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          GCE-style Paper 3 sessions: timer starts when you begin. Your work is marked by AI for wording-insensitive accuracy; model answers appear only after your instructor releases the marking guide.
        </p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!mocks && !error && <p className="text-sm text-muted-foreground">Loading examinations…</p>}

      {grouped &&
        (["MIXED", "DATABASE", "C_PROGRAMMING"] as const).map((key) => {
          const list = grouped[key];
          if (!list.length) return null;
          const { label, Icon } = focusMeta[key];
          return (
            <section key={key} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="size-4 text-primary" />
                {label}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((m) => (
                  <Card key={m.id} className="border-border/90">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {m.durationMinutes} minutes
                        </span>
                        <span>{m.questionCount} items</span>
                      </CardDescription>
                    </CardHeader>
                    {m.description && (
                      <CardContent className="pb-3 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3">{m.description}</p>
                      </CardContent>
                    )}
                    <CardContent className="pt-0">
                      <Button asChild size="sm">
                        <Link href={`/study/mocks/${m.id}`}>Open briefing</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

      {mocks && mocks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No published mocks yet. Your course team will publish exam sittings here.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
