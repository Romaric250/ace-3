"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutControl() {
  return (
    <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => signOut({ callbackUrl: "/" })}>
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
