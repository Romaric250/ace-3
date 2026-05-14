import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border/60 bg-gradient-to-b from-[color-mix(in_oklab,var(--color-primary)_12%,var(--color-background))] to-background">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                GCE Advanced Level · Computer Science · Paper 3
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Exam craft for <span className="text-primary">databases</span> and{" "}
                <span className="text-accent">C programming</span>.
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Ace Paper Master is built for students who need precision, not noise. Every generated explanation, mock item,
                and tutor response is scoped to the practical paper. Administrators grounded the models with your own past
                questions so guidance stays inside the examination boundary.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/auth/register">Begin preparation</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You will need an account to access study tools. The first registered profile becomes the platform administrator.
              </p>
            </div>
            <Card className="w-full max-w-md border-primary/25 lg:mb-2">
              <CardHeader>
                <CardTitle className="text-base">What you can do here</CardTitle>
                <CardDescription>Designed around two tracks only: SQL and C.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Question bank</p>
                  <p>Work items admins have published. Visibility is deliberate: nothing appears until it is ready for students.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Revision guides</p>
                  <p>Staff publish Markdown revision guides when ready; students only see materials marked public.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tutor</p>
                  <p>Chat with the same guardrails—useful for debugging scripts and SQL logic at Paper 3 depth.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
