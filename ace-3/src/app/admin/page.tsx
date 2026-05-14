"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, FileDown, Trash2 } from "lucide-react";
import { AdminMocksPanel } from "@/app/admin/mocks-panel";
import { PastPaperUploadButton } from "@/lib/uploadthing-components";

type Question = {
  id: string;
  topic: string;
  prompt: string;
  marks: number;
  publishedToStudents: boolean;
  sourceLabel?: string | null;
};

type Upload = {
  id: string;
  title: string;
  notes?: string | null;
  createdAt: string;
  fileUrl?: string | null;
  fileName?: string | null;
  createdBy: { email: string | null; name: string | null };
};

export default function AdminPage() {
  const [tab, setTab] = useState<"papers" | "mocks" | "guides" | "generate" | "manual" | "bank">("papers");

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);

  const [genTopic, setGenTopic] = useState<"DATABASE" | "C_PROGRAMMING" | "MIXED">("MIXED");
  const [genCount, setGenCount] = useState(6);
  const [genDifficulty, setGenDifficulty] = useState<"foundation" | "standard" | "stretch">("standard");
  const [genNotes, setGenNotes] = useState("");
  const [genPublish, setGenPublish] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  const [manual, setManual] = useState({
    topic: "DATABASE" as "DATABASE" | "C_PROGRAMMING" | "MIXED",
    prompt: "",
    modelAnswer: "",
    explanation: "",
    marks: 4,
    publish: false,
    sourceLabel: "",
  });
  const [manualBusy, setManualBusy] = useState(false);

  type CheatRow = {
    id: string;
    title: string;
    emphasisTopic: string | null;
    publishedToStudents: boolean;
    pdfUrl?: string | null;
    pdfFileName?: string | null;
    createdAt: string;
  };
  const [cheatSheets, setCheatSheets] = useState<CheatRow[] | null>(null);
  const [csEmphasis, setCsEmphasis] = useState<"DATABASE" | "C_PROGRAMMING" | "MIXED">("MIXED");
  const [csNotes, setCsNotes] = useState("");
  const [csPublish, setCsPublish] = useState(false);
  const [csBusy, setCsBusy] = useState(false);

  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(
    () =>
      [
        { id: "papers" as const, label: "Past paper extracts" },
        { id: "mocks" as const, label: "Mock examinations" },
        { id: "guides" as const, label: "Revision guides" },
        { id: "generate" as const, label: "AI question batch" },
        { id: "manual" as const, label: "Manual entry" },
        { id: "bank" as const, label: "Visibility" },
      ] as const,
    [],
  );

  const loadUploads = () =>
    fetch("/api/admin/past-papers")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unable to load uploads");
        return data.uploads as Upload[];
      })
      .then(setUploads);

  const loadQuestions = () =>
    fetch("/api/admin/questions")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unable to load questions");
        return data.questions as Question[];
      })
      .then(setQuestions);

  const loadCheatSheets = () =>
    fetch("/api/admin/cheat-sheets")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unable to load revision guides");
        return data.sheets as CheatRow[];
      })
      .then(setCheatSheets);

  useEffect(() => {
    loadUploads().catch((e: Error) => setError(e.message));
    loadQuestions().catch((e: Error) => setError(e.message));
    loadCheatSheets().catch((e: Error) => setError(e.message));
  }, []);

  const submitUpload = async () => {
    setUploadBusy(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/past-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          notes: uploadNotes || undefined,
          rawText: uploadText,
          fileUrl: uploadFileUrl || undefined,
          fileName: uploadFileName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
      setBanner("Past paper extract stored.");
      setUploadTitle("");
      setUploadNotes("");
      setUploadText("");
      setUploadFileUrl(null);
      setUploadFileName(null);
      await loadUploads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setUploadBusy(false);
  };

  const submitGenerate = async () => {
    setGenBusy(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          count: genCount,
          difficulty: genDifficulty,
          notes: genNotes || undefined,
          publish: genPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      setBanner(`Generated ${data.created} questions.`);
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    }
    setGenBusy(false);
  };

  const submitManual = async () => {
    setManualBusy(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/questions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: manual.topic,
          prompt: manual.prompt,
          modelAnswer: manual.modelAnswer,
          explanation: manual.explanation || undefined,
          marks: manual.marks,
          publishedToStudents: manual.publish,
          sourceLabel: manual.sourceLabel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      setBanner("Question saved to the bank.");
      setManual((m) => ({
        ...m,
        prompt: "",
        modelAnswer: "",
        explanation: "",
        sourceLabel: "",
      }));
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setManualBusy(false);
  };

  const togglePublished = async (id: string, published: boolean) => {
    setError(null);
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishedToStudents: published }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Update failed");
      return;
    }
    await loadQuestions();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question permanently?")) return;
    setError(null);
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    await loadQuestions();
  };

  const submitCheatGuide = async () => {
    setCsBusy(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/ai/cheat-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emphasis: csEmphasis, notes: csNotes || undefined, publish: csPublish }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      setBanner(csPublish ? "Revision guide created and published to students." : "Revision guide saved as draft (not visible to students).");
      setCsNotes("");
      await loadCheatSheets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    }
    setCsBusy(false);
  };

  const toggleCheatPublished = async (id: string, published: boolean) => {
    setError(null);
    const res = await fetch(`/api/admin/cheat-sheets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishedToStudents: published }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Update failed");
      return;
    }
    await loadCheatSheets();
  };

  const deleteCheatSheet = async (id: string) => {
    if (!confirm("Delete this revision guide permanently?")) return;
    setError(null);
    const res = await fetch(`/api/admin/cheat-sheets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    await loadCheatSheets();
  };

  const buildCheatPdf = async (sheetId: string) => {
    setError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/cheat-sheets/${sheetId}/pdf`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PDF build failed");
      if (data.base64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.base64}`;
        link.download = data.downloadName || "revision-guide.pdf";
        link.click();
      }
      setBanner(data.pdfUrl ? "PDF generated and hosted." : "PDF downloaded. Add UploadThing token to host online.");
      await loadCheatSheets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Administrator workspace</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Upload authentic past papers, generate or capture questions, and control what students can see. Publication is explicit:
          drafts stay hidden until you enable visibility.
        </p>
        {banner && <p className="text-sm font-medium text-success">{banner}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "papers" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add extract</CardTitle>
              <CardDescription>Paste OCR text or key segments. This content weights AI outputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="paper-title">Title</Label>
                <Input id="paper-title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. 2023 Paper 3 · Section B" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper-notes">Notes (optional)</Label>
                <Input id="paper-notes" value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper-text">Raw text</Label>
                <Textarea id="paper-text" className="min-h-[200px]" value={uploadText} onChange={(e) => setUploadText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Attach past-paper file</Label>
                <PastPaperUploadButton
                  endpoint="pastPaperAsset"
                  onClientUploadComplete={(res) => {
                    const f = res[0];
                    if (f?.url) setUploadFileUrl(f.url);
                    if (f?.name) setUploadFileName(f.name);
                    setBanner("File attached — add a title and save the extract.");
                  }}
                  appearance={{
                    button:
                      "ut-ready:bg-secondary ut-ready:text-secondary-foreground ut-uploading:bg-muted w-full rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium",
                  }}
                />
                {uploadFileUrl && (
                  <p className="break-all text-xs text-muted-foreground">
                    {uploadFileName ? `${uploadFileName} · ` : ""}
                    {uploadFileUrl}
                  </p>
                )}
              </div>
              <Button type="button" className="w-full" disabled={uploadBusy} onClick={() => void submitUpload()}>
                {uploadBusy ? "Saving…" : "Save extract"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repository</CardTitle>
              <CardDescription>Latest uploads appear first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!uploads && <p className="text-sm text-muted-foreground">Loading…</p>}
              {uploads?.map((u) => (
                <div key={u.id} className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
                  <div className="font-semibold">{u.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleString()} · {u.createdBy.name ?? u.createdBy.email}
                  </div>
                  {u.notes && <p className="mt-1 text-xs text-muted-foreground">{u.notes}</p>}
                  {u.fileUrl && (
                    <a
                      href={u.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {u.fileName ?? "Download attachment"}
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "mocks" && <AdminMocksPanel onBanner={setBanner} onError={setError} />}

      {tab === "guides" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate revision guide</CardTitle>
              <CardDescription>
                Uses uploaded past-paper extracts as context. Students only see guides you publish.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cs-emphasis">Emphasis</Label>
                <select
                  id="cs-emphasis"
                  className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                  value={csEmphasis}
                  onChange={(e) => setCsEmphasis(e.target.value as typeof csEmphasis)}
                >
                  <option value="MIXED">Balanced (database + C)</option>
                  <option value="DATABASE">Database / SQL</option>
                  <option value="C_PROGRAMMING">C programming</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cs-notes">Focus notes (optional)</Label>
                <Textarea
                  id="cs-notes"
                  value={csNotes}
                  onChange={(e) => setCsNotes(e.target.value)}
                  placeholder="Topics to stress, timing, pitfall warnings, …"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={csPublish} onChange={(e) => setCsPublish(e.target.checked)} />
                Publish to students immediately
              </label>
              <Button type="button" className="w-full" disabled={csBusy} onClick={() => void submitCheatGuide()}>
                {csBusy ? "Calling OpenAI…" : "Generate guide"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All guides</CardTitle>
              <CardDescription>Draft guides stay admin-only until you mark them visible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!cheatSheets && <p className="text-sm text-muted-foreground">Loading…</p>}
              {cheatSheets?.length === 0 && <p className="text-sm text-muted-foreground">No guides yet.</p>}
              {cheatSheets?.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(g.createdAt).toLocaleString()}
                      {g.emphasisTopic ? ` · ${g.emphasisTopic.replaceAll("_", " ")}` : ""}
                    </div>
                    {g.pdfUrl && (
                      <a
                        href={g.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {g.pdfFileName ?? "Open PDF"}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => void buildCheatPdf(g.id)}
                    >
                      <FileDown className="size-4" />
                      Build PDF
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={g.publishedToStudents ? "default" : "secondary"}
                      className="gap-1"
                      onClick={() => void toggleCheatPublished(g.id, !g.publishedToStudents)}
                    >
                      {g.publishedToStudents ? (
                        <>
                          <Eye className="size-4" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-4" />
                          Draft
                        </>
                      )}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Delete guide" onClick={() => void deleteCheatSheet(g.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "generate" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate a batch with OpenAI</CardTitle>
            <CardDescription>Questions are created as drafts unless you publish immediately.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Topic</Label>
              <select
                className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value as typeof genTopic)}
              >
                <option value="MIXED">GCE-style mixed (database + C)</option>
                <option value="DATABASE">Database / SQL</option>
                <option value="C_PROGRAMMING">C programming</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select
                className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value as typeof genDifficulty)}
              >
                <option value="foundation">Foundation</option>
                <option value="standard">Standard</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={genPublish} onChange={(e) => setGenPublish(e.target.checked)} />
              Publish to students immediately
            </label>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gen-notes">Author notes</Label>
              <Textarea id="gen-notes" value={genNotes} onChange={(e) => setGenNotes(e.target.value)} placeholder="Style cues, banned constructs, …" />
            </div>
            <div className="md:col-span-2">
              <Button type="button" disabled={genBusy} onClick={() => void submitGenerate()}>
                {genBusy ? "Calling OpenAI…" : "Generate batch"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capture a question manually</CardTitle>
            <CardDescription>Use this when you already have a trusted past-paper item.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Topic</Label>
              <select
                className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                value={manual.topic}
                onChange={(e) => setManual((m) => ({ ...m, topic: e.target.value as typeof manual.topic }))}
              >
                <option value="MIXED">Mixed (label as topic in bank)</option>
                <option value="DATABASE">Database / SQL</option>
                <option value="C_PROGRAMMING">C programming</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                type="number"
                min={1}
                max={50}
                value={manual.marks}
                onChange={(e) => setManual((m) => ({ ...m, marks: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea id="prompt" value={manual.prompt} onChange={(e) => setManual((m) => ({ ...m, prompt: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="answer">Model answer</Label>
              <Textarea id="answer" value={manual.modelAnswer} onChange={(e) => setManual((m) => ({ ...m, modelAnswer: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expl">Explanation (optional)</Label>
              <Textarea id="expl" value={manual.explanation} onChange={(e) => setManual((m) => ({ ...m, explanation: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="source">Source label (optional)</Label>
              <Input id="source" value={manual.sourceLabel} onChange={(e) => setManual((m) => ({ ...m, sourceLabel: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <input
                type="checkbox"
                checked={manual.publish}
                onChange={(e) => setManual((m) => ({ ...m, publish: e.target.checked }))}
              />
              Visible to students
            </label>
            <div className="md:col-span-2">
              <Button type="button" disabled={manualBusy} onClick={() => void submitManual()}>
                {manualBusy ? "Saving…" : "Save question"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "bank" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question bank visibility</CardTitle>
            <CardDescription>Toggle student access per item. Unpublished entries remain administrator-only.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-1">Topic</th>
                  <th className="px-2 py-1">Prompt</th>
                  <th className="px-2 py-1">Marks</th>
                  <th className="px-2 py-1">Visible</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {!questions && (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {questions?.map((q) => (
                  <tr key={q.id} className="rounded-[var(--radius-md)] bg-card/50 align-top">
                    <td className="px-2 py-2 text-xs font-semibold text-muted-foreground">{q.topic.replaceAll("_", " ")}</td>
                    <td className="px-2 py-2 text-sm text-foreground">{q.prompt}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{q.marks}</td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={q.publishedToStudents ? "default" : "secondary"}
                        className="gap-1"
                        onClick={() => void togglePublished(q.id, !q.publishedToStudents)}
                      >
                        {q.publishedToStudents ? (
                          <>
                            <Eye className="size-4" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-4" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Button type="button" size="icon" variant="ghost" aria-label="Delete" onClick={() => void deleteQuestion(q.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
