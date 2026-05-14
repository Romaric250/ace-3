"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Conversation = { id: string; title: string | null; updatedAt: string };
type Message = { id: string; role: string; content: string; createdAt: string };

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = () =>
    fetch("/api/chat/conversations")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unable to load conversations");
        return data.conversations as Conversation[];
      })
      .then(setConversations);

  useEffect(() => {
    loadConversations().catch((e: Error) => setError(e.message));
  }, []);

  const loadThread = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/chat/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to load thread");
      return;
    }
    setActiveId(id);
    setMessages(data.conversation.messages);
  };

  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId ?? undefined, message: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setDraft("");
      setActiveId(data.conversationId);
      await loadConversations();
      await loadThread(data.conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    }
    setBusy(false);
  };

  const heading = useMemo(
    () => conversations?.find((c) => c.id === activeId)?.title ?? "Tutor session",
    [activeId, conversations],
  );

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
          <CardDescription>Paper 3 scope only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" size="sm" variant="secondary" className="w-full" onClick={() => setActiveId(null)}>
            Start blank thread
          </Button>
          {!conversations && <p className="text-sm text-muted-foreground">Loading…</p>}
          {conversations?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void loadThread(c.id)}
              className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm ${
                activeId === c.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              <div className="font-medium line-clamp-2">{c.title || "Conversation"}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="flex min-h-[560px] flex-col">
        <CardHeader>
          <CardTitle className="text-base">{heading}</CardTitle>
          <CardDescription>
            Responses prioritise SQL and C constructs examined in the practical paper. Past uploads inform tone, not prerequisites.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-[var(--radius-md)] border border-border bg-background/40 p-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask a question to begin. Start a new thread anytime from the left.</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[95%] rounded-[var(--radius-md)] border px-3 py-2 text-sm leading-relaxed ${
                  m.role === "assistant"
                    ? "border-border bg-card text-muted-foreground"
                    : "ml-auto border-primary/50 bg-primary/10 text-foreground"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.role}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Pose a Paper 3 question…" />
            <div className="flex justify-end gap-2">
              <Button type="button" disabled={busy} onClick={() => void send()}>
                {busy ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
