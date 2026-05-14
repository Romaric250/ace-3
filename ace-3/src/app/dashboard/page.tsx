import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookMarked, Clock, LayoutDashboard, MessagesSquare, ScrollText } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {user?.name ? `${user.name}, ` : ""}
            This workspace orients every exercise to GCE Computer Science Paper 3: relational databases and{" "}
            <span className="text-foreground">C programming</span> only. Complete each track in sequence before the exam.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                Timed mock exams
              </CardTitle>
              <CardDescription>Timed papers with written answers, AI marking, and results when you submit.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/study/mocks" className="gap-2">
                  View mock examinations
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookMarked className="size-4 text-accent" />
                Topic practice
              </CardTitle>
              <CardDescription>Browse prompts only—model answers stay hidden until a mock marking guide is released.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/study/practice" className="gap-2">
                  Open practice bank
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="size-4 text-accent" />
                Revision guides
              </CardTitle>
              <CardDescription>Read instructor-published summaries when they are made available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/study/cheat-sheets" className="gap-2">
                  Open revision guides
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessagesSquare className="size-4 text-primary" />
                Tutor
              </CardTitle>
              <CardDescription>Ask for clarification with the same syllabus guardrails as the rest of the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/study/chat" className="gap-2">
                  Start a thread
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-card/40 p-4 md:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LayoutDashboard className="size-4" />
            Quick navigation
          </div>
          <div className="mt-3 grid gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/study/mocks">Mock exams</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/study/practice">Topic practice</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/study/cheat-sheets">Revision guides</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/study/chat">Tutor</Link>
            </Button>
            {user?.role === "ADMIN" && (
              <Button asChild size="sm">
                <Link href="/admin">Admin workspace</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
