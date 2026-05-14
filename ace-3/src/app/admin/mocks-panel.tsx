"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

type Question = { id: string; topic: string; prompt: string; marks: number };
type MockRow = {
  id: string;
  title: string;
  durationMinutes: number;
  focus: string;
  publishedToStudents: boolean;
  markingGuideReleased: boolean;
  _count: { items: number; attempts: number };
};

export function AdminMocksPanel({
  onBanner,
  onError,
}: {
  onBanner: (s: string | null) => void;
  onError: (s: string | null) => void;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [mocks, setMocks] = useState<MockRow[] | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(120);
  const [focus, setFocus] = useState<"DATABASE" | "C_PROGRAMMING" | "MIXED">("MIXED");
  const [publish, setPublish] = useState(false);
  const [releaseGuide, setReleaseGuide] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadQs = useCallback(
    () =>
      fetch("/api/admin/questions")
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Failed questions");
          return data.questions as Question[];
        })
        .then(setQuestions),
    [],
  );

  const loadMocks = useCallback(
    () =>
      fetch("/api/admin/mocks")
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Failed mocks");
          return data.mocks as MockRow[];
        })
        .then(setMocks),
    [],
  );

  useEffect(() => {
    loadQs().catch((e: Error) => onError(e.message));
    loadMocks().catch((e: Error) => onError(e.message));
  }, [loadQs, loadMocks, onError]);

  const selectedIds = useMemo(() => Object.keys(sel).filter((k) => sel[k]), [sel]);

  const toggle = (id: string) => setSel((s) => ({ ...s, [id]: !s[id] }));

  const createMock = async () => {
    setBusy(true);
    onError(null);
    onBanner(null);
    try {
      const res = await fetch("/api/admin/mocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled mock",
          description: description || undefined,
          durationMinutes: duration,
          focus,
          questionIds: selectedIds,
          publish,
          markingGuideReleased: releaseGuide,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Create failed");
      onBanner("Mock examination saved.");
      setTitle("");
      setDescription("");
      setSel({});
      await loadMocks();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  };

  const patchMock = async (id: string, body: Record<string, unknown>) => {
    onError(null);
    const res = await fetch(`/api/admin/mocks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      onError(data.error || "Update failed");
      return;
    }
    await loadMocks();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compose mock</CardTitle>
          <CardDescription>Select questions, set duration (e.g. 120 minutes), choose paper focus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="mt">Title</Label>
            <Input id="mt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2026 Paper 3 · SQL sitting" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="md">Briefing notes (optional)</Label>
            <Textarea id="md" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="dur">Minutes</Label>
              <Input id="dur" type="number" min={15} max={300} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Focus</Label>
              <select
                className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                value={focus}
                onChange={(e) => setFocus(e.target.value as typeof focus)}
              >
                <option value="MIXED">Mixed (full paper)</option>
                <option value="DATABASE">Database / SQL</option>
                <option value="C_PROGRAMMING">C programming</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Visible to students
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={releaseGuide} onChange={(e) => setReleaseGuide(e.target.checked)} />
            Release marking guide immediately after publish (students see model answers once submitted)
          </label>
          <div className="max-h-56 overflow-y-auto rounded-md border border-border">
            {!questions && <p className="p-3 text-xs text-muted-foreground">Loading bank…</p>}
            {questions?.map((q) => (
              <label
                key={q.id}
                className="flex cursor-pointer items-start gap-2 border-b border-border/60 px-3 py-2 text-sm last:border-0 hover:bg-muted/50"
              >
                <input type="checkbox" checked={!!sel[q.id]} onChange={() => toggle(q.id)} />
                <span className="min-w-0">
                  <span className="text-xs text-muted-foreground">{q.topic.replaceAll("_", " ")} · {q.marks}m</span>
                  <span className="block text-foreground">{q.prompt.slice(0, 160)}{q.prompt.length > 160 ? "…" : ""}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedIds.length} question{selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <Button type="button" className="w-full" disabled={busy || selectedIds.length === 0} onClick={() => void createMock()}>
            {busy ? "Saving…" : "Save mock"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published mocks</CardTitle>
          <CardDescription>Control visibility and when students may unlock official marking guidance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!mocks && <p className="text-sm text-muted-foreground">Loading…</p>}
          {mocks?.map((m) => (
            <div key={m.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                {m.durationMinutes} min · {m.focus.replaceAll("_", " ")} · {m._count.items} questions · {m._count.attempts} attempts
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={m.publishedToStudents ? "default" : "secondary"}
                  className="gap-1"
                  onClick={() => void patchMock(m.id, { publishedToStudents: !m.publishedToStudents })}
                >
                  {m.publishedToStudents ? (
                    <>
                      <Eye className="size-4" /> Live
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-4" /> Hidden
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={m.markingGuideReleased ? "default" : "outline"}
                  onClick={() => void patchMock(m.id, { markingGuideReleased: !m.markingGuideReleased })}
                >
                  {m.markingGuideReleased ? "Marking guide: on" : "Marking guide: off"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm("Delete this mock and all attempt data?")) return;
                    onError(null);
                    const res = await fetch(`/api/admin/mocks/${m.id}`, { method: "DELETE" });
                    if (!res.ok) {
                      const data = await res.json();
                      onError(data.error || "Delete failed");
                      return;
                    }
                    await loadMocks();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
