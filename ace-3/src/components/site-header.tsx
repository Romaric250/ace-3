import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessagesSquare, ScrollText, Shield, BookMarked } from "lucide-react";
import { SignOutControl } from "@/components/sign-out-control";

export async function SiteHeader() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--color-primary)_70%,var(--color-accent))] font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            A3
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold leading-tight tracking-tight">
              Ace Paper <span className="text-primary">Master</span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">Computer Science · Paper 3</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard" className="gap-1">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/study/mocks" className="gap-1">
                  <BookMarked className="size-4" />
                  Mock exams
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/study/cheat-sheets" className="gap-1">
                  <ScrollText className="size-4" />
                  Revision guides
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/study/chat" className="gap-1">
                  <MessagesSquare className="size-4" />
                  Tutor
                </Link>
              </Button>
              {user.role === "ADMIN" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin" className="gap-1">
                    <Shield className="size-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <SignOutControl />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard">Menu</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
