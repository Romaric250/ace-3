import { Suspense } from "react";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-10 text-sm text-muted-foreground">Loading…</main>}>
      <SignInForm />
    </Suspense>
  );
}
