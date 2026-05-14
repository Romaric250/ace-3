"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading reader…</p>,
});

type SheetList = {
  id: string;
  title: string;
  emphasisTopic: string | null;
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  createdAt: string;
};

export default function CheatSheetsPage() {
  const [sheets, setSheets] = useState<SheetList[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<{
    title: string;
    markdown: string;
    pdfUrl?: string | null;
    pdfFileName?: string | null;
  } | null>(null);

  const load = () =>
    fetch("/api/cheat-sheets")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load guides");
        return data.sheets as SheetList[];
      })
      .then(setSheets);

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  const openSheet = async (id: string, listMeta?: SheetList) => {
    setError(null);
    const res = await fetch(`/api/cheat-sheets/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to load guide");
      return;
    }
    setActive({
      title: data.sheet.title,
      markdown: data.sheet.markdown,
      pdfUrl: data.sheet.pdfUrl ?? listMeta?.pdfUrl ?? null,
      pdfFileName: data.sheet.pdfFileName ?? listMeta?.pdfFileName ?? null,
    });
  };

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col gap-8 px-4 py-8 lg:grid lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
      <div className="flex min-h-0 flex-col space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Revision guides</h1>
          <p className="text-sm text-muted-foreground">
            Published summaries for Paper 3. When your team generates a PDF, you can preview it inline and download a copy.
          </p>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="shrink-0">
            <CardTitle className="text-base">Published guides</CardTitle>
            <CardDescription>Select a guide to open the reader.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!sheets && <p className="text-sm text-muted-foreground">Loading…</p>}
            {sheets && sheets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No public revision guide is available yet. Check back after your instructor publishes one.
              </p>
            )}
            {sheets?.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void openSheet(s.id, s)}
                className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="min-w-0 flex-1 font-medium">{s.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col lg:min-h-[520px]">
        <CardHeader className="shrink-0 space-y-2">
          <CardTitle className="text-base">{active ? active.title : "Reader"}</CardTitle>
          <CardDescription>PDF when available; otherwise the original markdown view.</CardDescription>
          {active?.pdfUrl && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="secondary" className="gap-1">
                <a href={active.pdfUrl} download={active.pdfFileName ?? undefined}>
                  <FileDown className="size-4" />
                  Download PDF
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={active.pdfUrl} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          {active?.pdfUrl ? (
            <div className="min-h-[360px] flex-1 overflow-hidden rounded-[var(--radius-md)] border border-border bg-muted/30">
              <iframe title="Revision guide PDF" src={active.pdfUrl} className="h-full min-h-[360px] w-full" />
            </div>
          ) : null}
          {active ? (
            <article className={`prose-study max-w-none ${active.pdfUrl ? "border-t border-border pt-4" : ""}`}>
              {active.pdfUrl ? (
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Markdown source</p>
              ) : null}
              <ReactMarkdown>{active.markdown}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-muted-foreground">Choose a guide from the list, or wait until one is published.</p>
          )}
          {!active && (
            <p className="text-xs text-muted-foreground">
              Sitting a mock? Go to <Link href="/study/mocks" className="text-primary underline-offset-4 hover:underline">mock exams</Link>.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
